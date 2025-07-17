import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateReview } from '../../domain/entities/template-review.entity';
import { WorkflowTemplate } from '../../domain/entities/workflow-template.entity';
import { CreateReviewDto } from '../dto';
import { User } from '../../../auth/domain/entities/user.entity';
import { PaginatedResult } from '../../../../core/interfaces/paginated-result.interface';

@Injectable()
export class TemplateReviewService {
  constructor(
    @InjectRepository(TemplateReview)
    private readonly reviewRepository: Repository<TemplateReview>,
    @InjectRepository(WorkflowTemplate)
    private readonly templateRepository: Repository<WorkflowTemplate>,
  ) {}

  async create(
    templateId: string,
    dto: CreateReviewDto,
    user: User,
  ): Promise<TemplateReview> {
    // Check if template exists
    const template = await this.templateRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Check if user already reviewed this template
    const existingReview = await this.reviewRepository.findOne({
      where: {
        template: { id: templateId },
        reviewer: { id: user.id },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this template');
    }

    // Check if user is reviewing their own template
    if (template.creatorId === user.id) {
      throw new BadRequestException('You cannot review your own template');
    }

    // Create review
    const review = this.reviewRepository.create({
      ...dto,
      template,
      reviewer: user,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update template rating
    await this.updateTemplateRating(templateId);

    return savedReview;
  }

  async update(
    id: string,
    dto: Partial<CreateReviewDto>,
    user: User,
  ): Promise<TemplateReview> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['reviewer', 'template'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user owns this review
    if (review.reviewer.id !== user.id) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Update review
    Object.assign(review, dto);
    const updatedReview = await this.reviewRepository.save(review);

    // Update template rating
    await this.updateTemplateRating(review.template.id);

    return updatedReview;
  }

  async delete(id: string, user: User): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['reviewer', 'template'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user owns this review or is admin
    if (review.reviewer.id !== user.id) {
      // TODO: Add admin check
      throw new ForbiddenException('You can only delete your own reviews');
    }

    const templateId = review.template.id;
    await this.reviewRepository.remove(review);

    // Update template rating
    await this.updateTemplateRating(templateId);
  }

  async findByTemplate(
    templateId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<TemplateReview>> {
    const query = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.reviewer', 'reviewer')
      .where('review.templateId = :templateId', { templateId })
      .andWhere('review.isVisible = :isVisible', { isVisible: true })
      .orderBy('review.createdAt', 'DESC');

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markHelpful(id: string, isHelpful: boolean): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (isHelpful) {
      await this.reviewRepository.increment({ id }, 'helpfulCount', 1);
    } else {
      await this.reviewRepository.increment({ id }, 'unhelpfulCount', 1);
    }
  }

  async moderate(
    id: string,
    isVisible: boolean,
    moderationNote: string,
    moderator: User,
  ): Promise<TemplateReview> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['template'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isVisible = isVisible;
    review.moderationNote = moderationNote;
    review.moderatedBy = moderator;
    review.moderatedAt = new Date();

    const moderated = await this.reviewRepository.save(review);

    // Update template rating if review visibility changed
    await this.updateTemplateRating(review.template.id);

    return moderated;
  }

  private async updateTemplateRating(templateId: string): Promise<void> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.templateId = :templateId', { templateId })
      .andWhere('review.isVisible = :isVisible', { isVisible: true })
      .getRawOne();

    const avgRating = parseFloat(result.avgRating) || 0;
    const reviewCount = parseInt(result.count) || 0;

    await this.templateRepository.update(templateId, {
      averageRating: avgRating,
      reviewCount,
    });
  }
}
