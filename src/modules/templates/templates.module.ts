import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  WorkflowTemplate,
  TemplateCategory,
  TemplateReview,
} from './domain/entities';
import {
  WorkflowTemplateService,
  TemplateReviewService,
  TemplateCategoryService,
} from './application/services';
import {
  WorkflowTemplateController,
  TemplateReviewController,
  TemplateCategoryController,
} from './presentation/controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowTemplate,
      TemplateCategory,
      TemplateReview,
    ]),
  ],
  controllers: [
    WorkflowTemplateController,
    TemplateReviewController,
    TemplateCategoryController,
  ],
  providers: [
    WorkflowTemplateService,
    TemplateReviewService,
    TemplateCategoryService,
  ],
  exports: [
    WorkflowTemplateService,
    TemplateReviewService,
    TemplateCategoryService,
  ],
})
export class TemplatesModule {}
