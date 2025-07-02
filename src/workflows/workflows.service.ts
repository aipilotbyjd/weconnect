import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from '../core/infrastructure/database/entities/workflow.entity';
import { WorkflowNode } from '../core/infrastructure/database/entities/workflow-node.entity';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowNode)
    private readonly workflowNodeRepository: Repository<WorkflowNode>,
  ) {}

  async create(createWorkflowDto: CreateWorkflowDto, userId: string): Promise<Workflow> {
    const { nodes, ...workflowData } = createWorkflowDto;
    
    const workflow = this.workflowRepository.create({
      ...workflowData,
      userId,
    });
    
    const savedWorkflow = await this.workflowRepository.save(workflow);
    
    if (nodes && nodes.length > 0) {
      const workflowNodes = nodes.map(nodeData =>
        this.workflowNodeRepository.create({
          ...nodeData,
          workflowId: savedWorkflow.id,
        })
      );
      
      await this.workflowNodeRepository.save(workflowNodes);
    }
    
    return this.findOne(savedWorkflow.id);
  }

  async findAll(userId: string): Promise<Workflow[]> {
    return this.workflowRepository.find({
      where: { userId },
      relations: ['nodes'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Workflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { id },
      relations: ['nodes', 'user'],
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return workflow;
  }

  async update(id: string, updateWorkflowDto: UpdateWorkflowDto, userId: string): Promise<Workflow> {
    const workflow = await this.findOne(id);
    
    if (workflow.userId !== userId) {
      throw new ForbiddenException('You can only update your own workflows');
    }

    const { nodes, ...workflowData } = updateWorkflowDto;
    
    await this.workflowRepository.update(id, workflowData);
    
    if (nodes) {
      // Remove existing nodes
      await this.workflowNodeRepository.delete({ workflowId: id });
      
      // Add new nodes
      if (nodes.length > 0) {
        const workflowNodes = nodes.map(nodeData =>
          this.workflowNodeRepository.create({
            ...nodeData,
            workflowId: id,
          })
        );
        
        await this.workflowNodeRepository.save(workflowNodes);
      }
    }
    
    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const workflow = await this.findOne(id);
    
    if (workflow.userId !== userId) {
      throw new ForbiddenException('You can only delete your own workflows');
    }

    await this.workflowRepository.remove(workflow);
  }

  async activate(id: string, userId: string): Promise<Workflow> {
    const workflow = await this.findOne(id);
    
    if (workflow.userId !== userId) {
      throw new ForbiddenException('You can only activate your own workflows');
    }

    workflow.isActive = true;
    await this.workflowRepository.save(workflow);
    
    return workflow;
  }

  async deactivate(id: string, userId: string): Promise<Workflow> {
    const workflow = await this.findOne(id);
    
    if (workflow.userId !== userId) {
      throw new ForbiddenException('You can only deactivate your own workflows');
    }

    workflow.isActive = false;
    await this.workflowRepository.save(workflow);
    
    return workflow;
  }
}
