import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { TemplateCategory } from '../../domain/entities/template-category.entity';
import { CreateCategoryDto } from '../dto';

@Injectable()
export class TemplateCategoryService {
  constructor(
    @InjectRepository(TemplateCategory)
    private readonly categoryRepository: TreeRepository<TemplateCategory>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<TemplateCategory> {
    // Check slug uniqueness
    const existing = await this.categoryRepository.findOne({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new BadRequestException('Category with this slug already exists');
    }

    // Get parent if specified
    let parent: TemplateCategory | null = null;
    if (dto.parentId) {
      parent = await this.categoryRepository.findOne({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    // Create category
    const category = this.categoryRepository.create({
      ...dto,
      parent: parent || undefined,
    });

    return await this.categoryRepository.save(category);
  }

  async update(
    id: string,
    dto: Partial<CreateCategoryDto>,
  ): Promise<TemplateCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check slug uniqueness if changed
    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoryRepository.findOne({
        where: { slug: dto.slug },
      });

      if (existing) {
        throw new BadRequestException('Category with this slug already exists');
      }
    }

    // Update parent if changed
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      if (dto.parentId) {
        const parent = await this.categoryRepository.findOne({
          where: { id: dto.parentId },
        });

        if (!parent) {
          throw new NotFoundException('Parent category not found');
        }

        // Check for circular reference
        const ancestors = await this.categoryRepository.findAncestors(parent);
        if (ancestors.some((a) => a.id === id)) {
          throw new BadRequestException('Circular reference detected');
        }

        category.parent = parent;
      } else {
        category.parent = null;
      }
    }

    // Update other fields
    Object.assign(category, dto);

    return await this.categoryRepository.save(category);
  }

  async delete(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['children'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.children?.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with subcategories',
      );
    }

    await this.categoryRepository.remove(category);
  }

  async findAll(): Promise<TemplateCategory[]> {
    return await this.categoryRepository.findTrees({
      relations: ['parent', 'children'],
    });
  }

  async findOne(id: string): Promise<TemplateCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'templates'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string): Promise<TemplateCategory> {
    const category = await this.categoryRepository.findOne({
      where: { slug },
      relations: ['parent', 'children', 'templates'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findActive(): Promise<TemplateCategory[]> {
    const roots = await this.categoryRepository.findRoots();
    const trees = await Promise.all(
      roots.map((root) =>
        this.categoryRepository.findDescendantsTree(root, {
          relations: ['parent', 'children'],
        }),
      ),
    );

    // Filter only active categories
    return this.filterActive(trees);
  }

  private filterActive(categories: TemplateCategory[]): TemplateCategory[] {
    return categories
      .filter((cat) => cat.isActive)
      .map((cat) => ({
        ...cat,
        children: cat.children ? this.filterActive(cat.children) : [],
      }));
  }
}
