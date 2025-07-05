import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { TemplateReviewService } from '../../application/services';
import { CreateReviewDto } from '../../application/dto';
import { TemplateReview } from '../../domain/entities';

@ApiTags('Template Reviews')
@Controller('api/v1/workflow-templates/:templateId/reviews')
export class TemplateReviewController {
  constructor(
    private readonly reviewService: TemplateReviewService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a template' })
  async create(
    @Param('templateId') templateId: string,
    @Body() dto: CreateReviewDto,
    @Request() req,
  ): Promise<TemplateReview> {
    return await this.reviewService.create(templateId, dto, req.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateReviewDto>,
    @Request() req,
  ): Promise<TemplateReview> {
    return await this.reviewService.update(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  async delete(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    await this.reviewService.delete(id, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get reviews for a template' })
  async findByTemplate(
    @Param('templateId') templateId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.reviewService.findByTemplate(templateId, page, limit);
  }

  @Post(':id/helpful')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a review as helpful' })
  async markHelpful(
    @Param('id') id: string,
    @Body('isHelpful') isHelpful: boolean,
  ): Promise<void> {
    await this.reviewService.markHelpful(id, isHelpful);
  }

  @Post(':id/moderate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Moderate a review (admin only)' })
  async moderate(
    @Param('id') id: string,
    @Body('isVisible') isVisible: boolean,
    @Body('moderationNote') moderationNote: string,
    @Request() req,
  ): Promise<TemplateReview> {
    return await this.reviewService.moderate(
      id,
      isVisible,
      moderationNote,
      req.user,
    );
  }
}
