import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from '../../domain/entities/workflow.entity';

@Injectable()
export class GetWorkflowsUseCase {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
  ) {}

  async execute(userId: string): Promise<Workflow[]> {
    return this.workflowRepository.find({
      where: { userId },
      relations: ['nodes'],
      order: { createdAt: 'DESC' },
    });
  }

  async executeById(id: string): Promise<Workflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { id },
      relations: ['nodes', 'user'],
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    return workflow;
  }
}
