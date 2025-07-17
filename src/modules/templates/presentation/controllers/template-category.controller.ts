import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { TemplateCategoryService } from '../../application/services';
import { CreateCategoryDto } from '../../application/dto';
import { TemplateCategory } from '../../domain/entities';

@ApiTags('Template Categories')
@Controller('api/v1/template-categories')
export class TemplateCategoryController {
  constructor(private readonly categoryService: TemplateCategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new template category (admin only)' })
  async create(@Body() dto: CreateCategoryDto): Promise<TemplateCategory> {
    return await this.categoryService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a template category (admin only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCategoryDto>,
  ): Promise<TemplateCategory> {
    return await this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a template category (admin only)' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.categoryService.delete(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all template categories' })
  async findAll(): Promise<TemplateCategory[]> {
    return await this.categoryService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active template categories' })
  async findActive(): Promise<TemplateCategory[]> {
    return await this.categoryService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a template category by ID' })
  async findOne(@Param('id') id: string): Promise<TemplateCategory> {
    return await this.categoryService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a template category by slug' })
  async findBySlug(@Param('slug') slug: string): Promise<TemplateCategory> {
    return await this.categoryService.findBySlug(slug);
  }
}
