import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { WorkflowTemplate, TemplateStatus, TemplateVisibility } from '../../domain/entities/workflow-template.entity';
import { CreateTemplateDto, UpdateTemplateDto, SearchTemplatesDto, TemplateSortBy } from '../dto';
import { User } from '../../../auth/domain/entities/user.entity';
import { Organization } from '../../../organizations/domain/entities/organization.entity';
import { TemplateCategory } from '../../domain/entities/template-category.entity';
import { PaginatedResult } from '../../../../core/interfaces/paginated-result.interface';

@Injectable()
export class WorkflowTemplateService {
  constructor(
    @InjectRepository(WorkflowTemplate)
    private readonly templateRepository: Repository<WorkflowTemplate>,
    @InjectRepository(TemplateCategory)
    private readonly categoryRepository: Repository<TemplateCategory>,
  ) {}

  async create(dto: CreateTemplateDto, user: User): Promise<WorkflowTemplate> {
    // Verify slug uniqueness
    const existingTemplate = await this.templateRepository.findOne({
      where: { slug: dto.slug },
    });

    if (existingTemplate) {
      throw new BadRequestException('Template with this slug already exists');
    }

    // Verify categories exist
    let categories: TemplateCategory[] = [];
    if (dto.categoryIds?.length) {
      categories = await this.categoryRepository.findBy({
        id: In(dto.categoryIds),
      });
      
      if (categories.length !== dto.categoryIds.length) {
        throw new BadRequestException('One or more categories not found');
      }
    }

    // Create template
    const template = this.templateRepository.create({
      ...dto,
      creator: user,
      creatorId: user.id,
      categories,
      tags: dto.tags || [],
      status: TemplateStatus.DRAFT,
    });

    return await this.templateRepository.save(template);
  }

  async update(id: string, dto: UpdateTemplateDto, user: User): Promise<WorkflowTemplate> {
    const template = await this.findOneWithPermissionCheck(id, user);

    // Verify slug uniqueness if changed
    if (dto.slug && dto.slug !== template.slug) {
      const existingTemplate = await this.templateRepository.findOne({
        where: { slug: dto.slug },
      });

      if (existingTemplate) {
        throw new BadRequestException('Template with this slug already exists');
      }
    }

    // Update categories if provided
    if (dto.categoryIds !== undefined) {
      const categories = dto.categoryIds.length 
        ? await this.categoryRepository.findBy({ id: In(dto.categoryIds) })
        : [];
      
      if (dto.categoryIds.length && categories.length !== dto.categoryIds.length) {
        throw new BadRequestException('One or more categories not found');
      }
      
      template.categories = categories;
    }

    // Update fields
    Object.assign(template, dto);

    return await this.templateRepository.save(template);
  }

  async delete(id: string, user: User): Promise<void> {
    const template = await this.findOneWithPermissionCheck(id, user);
    await this.templateRepository.remove(template);
  }

  async findOne(id: string): Promise<WorkflowTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['creator', 'organization', 'categories', 'reviews'],
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Increment view count
    await this.templateRepository.increment({ id }, 'viewCount', 1);

    return template;
  }

  async search(dto: SearchTemplatesDto, user?: User): Promise<PaginatedResult<WorkflowTemplate>> {
    const query = this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.creator', 'creator')
      .leftJoinAndSelect('template.organization', 'organization')
      .leftJoinAndSelect('template.categories', 'categories');

    // Apply filters
    this.applySearchFilters(query, dto, user);

    // Apply sorting
    this.applySorting(query, dto.sortBy);

    // Paginate
    const [items, total] = await query
      .skip((dto.page - 1) * dto.limit)
      .take(dto.limit)
      .getManyAndCount();

    return {
      items,
      total,
      page: dto.page,
      limit: dto.limit,
      totalPages: Math.ceil(total / dto.limit),
    };
  }

  async publish(id: string, user: User): Promise<WorkflowTemplate> {
    const template = await this.findOneWithPermissionCheck(id, user);

    if (template.status !== TemplateStatus.DRAFT) {
      throw new BadRequestException('Only draft templates can be published');
    }

    template.status = TemplateStatus.PENDING_REVIEW;
    template.publishedAt = new Date();

    return await this.templateRepository.save(template);
  }

  async approve(id: string, user: User): Promise<WorkflowTemplate> {
    // TODO: Add admin permission check
    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.status !== TemplateStatus.PENDING_REVIEW) {
      throw new BadRequestException('Only templates pending review can be approved');
    }

    template.status = TemplateStatus.APPROVED;

    return await this.templateRepository.save(template);
  }

  async reject(id: string, reason: string, user: User): Promise<WorkflowTemplate> {
    // TODO: Add admin permission check
    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.status !== TemplateStatus.PENDING_REVIEW) {
      throw new BadRequestException('Only templates pending review can be rejected');
    }

    template.status = TemplateStatus.REJECTED;
    template.rejectionReason = reason;

    return await this.templateRepository.save(template);
  }

  async importTemplate(id: string, user: User, organizationId?: string): Promise<WorkflowTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Check permissions
    if (!template.canBeUsedBy(user.id, organizationId)) {
      throw new ForbiddenException('You do not have permission to use this template');
    }

    // Increment usage count
    await this.templateRepository.increment({ id }, 'usageCount', 1);

    return template;
  }

  async downloadTemplate(id: string, user: User, organizationId?: string): Promise<WorkflowTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Check permissions
    if (!template.canBeUsedBy(user.id, organizationId)) {
      throw new ForbiddenException('You do not have permission to download this template');
    }

    // TODO: Check if user has access to premium templates

    // Increment download count
    await this.templateRepository.increment({ id }, 'downloadCount', 1);

    return template;
  }

  private async findOneWithPermissionCheck(id: string, user: User): Promise<WorkflowTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['creator', 'organization', 'categories'],
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Only creator can modify their templates
    if (template.creatorId !== user.id) {
      throw new ForbiddenException('You do not have permission to modify this template');
    }

    return template;
  }

  private applySearchFilters(
    query: SelectQueryBuilder<WorkflowTemplate>,
    dto: SearchTemplatesDto,
    user?: User,
  ): void {
    // Text search
    if (dto.query) {
      query.andWhere(
        '(template.name ILIKE :query OR template.description ILIKE :query OR template.tags::text ILIKE :query)',
        { query: `%${dto.query}%` },
      );
    }

    // Category filter
    if (dto.categoryIds?.length) {
      query
        .innerJoin('template.categories', 'filterCategory')
        .andWhere('filterCategory.id IN (:...categoryIds)', {
          categoryIds: dto.categoryIds,
        });
    }

    // Tags filter
    if (dto.tags?.length) {
      query.andWhere('template.tags && :tags', { tags: dto.tags });
    }

    // Visibility filter
    if (dto.visibility?.length) {
      query.andWhere('template.visibility IN (:...visibility)', {
        visibility: dto.visibility,
      });
    } else {
      // Default: Show only public/marketplace templates to anonymous users
      if (!user) {
        query.andWhere('template.visibility IN (:...defaultVisibility)', {
          defaultVisibility: [TemplateVisibility.PUBLIC, TemplateVisibility.MARKETPLACE],
        });
      }
    }

    // Status filter
    if (dto.statuses?.length) {
      query.andWhere('template.status IN (:...statuses)', {
        statuses: dto.statuses,
      });
    } else {
      // Default: Show only approved templates
      query.andWhere('template.status = :status', {
        status: TemplateStatus.APPROVED,
      });
    }

    // Tier filter
    if (dto.tiers?.length) {
      query.andWhere('template.tier IN (:...tiers)', { tiers: dto.tiers });
    }

    // Price filter
    if (dto.minPrice !== undefined) {
      query.andWhere('template.price >= :minPrice', { minPrice: dto.minPrice });
    }
    if (dto.maxPrice !== undefined) {
      query.andWhere('template.price <= :maxPrice', { maxPrice: dto.maxPrice });
    }

    // Rating filter
    if (dto.minRating !== undefined) {
      query.andWhere('template.averageRating >= :minRating', {
        minRating: dto.minRating,
      });
    }

    // Featured filter
    if (dto.isFeatured !== undefined) {
      query.andWhere('template.isFeatured = :isFeatured', {
        isFeatured: dto.isFeatured,
      });
    }

    // Official filter
    if (dto.isOfficial !== undefined) {
      query.andWhere('template.isOfficial = :isOfficial', {
        isOfficial: dto.isOfficial,
      });
    }

    // Creator filter
    if (dto.creatorId) {
      query.andWhere('template.creatorId = :creatorId', {
        creatorId: dto.creatorId,
      });
    }

    // Organization filter
    if (dto.organizationId) {
      query.andWhere('template.organizationId = :organizationId', {
        organizationId: dto.organizationId,
      });
    }

    // Always filter active templates
    query.andWhere('template.isActive = :isActive', { isActive: true });
  }

  private applySorting(
    query: SelectQueryBuilder<WorkflowTemplate>,
    sortBy: TemplateSortBy,
  ): void {
    switch (sortBy) {
      case TemplateSortBy.NEWEST:
        query.orderBy('template.createdAt', 'DESC');
        break;
      case TemplateSortBy.OLDEST:
        query.orderBy('template.createdAt', 'ASC');
        break;
      case TemplateSortBy.POPULAR:
        query.orderBy('template.usageCount', 'DESC');
        break;
      case TemplateSortBy.RATING:
        query.orderBy('template.averageRating', 'DESC');
        break;
      case TemplateSortBy.PRICE_LOW_TO_HIGH:
        query.orderBy('template.price', 'ASC');
        break;
      case TemplateSortBy.PRICE_HIGH_TO_LOW:
        query.orderBy('template.price', 'DESC');
        break;
      case TemplateSortBy.NAME:
        query.orderBy('template.name', 'ASC');
        break;
      default:
        query.orderBy('template.usageCount', 'DESC');
    }
  }
}
