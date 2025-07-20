import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Workflow } from '../../domain/entities/workflow.entity';
import { WorkflowNode } from '../../domain/entities/workflow-node.entity';
import { WorkflowNodeConnection } from '../../domain/entities/workflow-node-connection.entity';
import { CreateWorkflowDto } from '../../presentation/dto/create-workflow.dto';
import { UpdateWorkflowDto } from '../../presentation/dto/update-workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectModel(Workflow.name)
    private readonly workflowModel: Model<Workflow>,
    @InjectModel(WorkflowNode.name)
    private readonly workflowNodeModel: Model<WorkflowNode>,
    @InjectModel(WorkflowNodeConnection.name)
    private readonly connectionModel: Model<WorkflowNodeConnection>,
  ) {}

  async create(
    createWorkflowDto: CreateWorkflowDto,
    userId: string,
    organizationId: string,
  ): Promise<Workflow> {
    const workflow = new this.workflowModel({
      ...createWorkflowDto,
      userId: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(organizationId),
    });

    return workflow.save();
  }

  async findAll(
    userId: string,
    organizationId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ workflows: Workflow[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const [workflows, total] = await Promise.all([
      this.workflowModel
        .find({ 
          organizationId: new Types.ObjectId(organizationId),
          deletedAt: null 
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.workflowModel.countDocuments({ 
        organizationId: new Types.ObjectId(organizationId),
        deletedAt: null 
      }),
    ]);

    return {
      workflows,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string, organizationId: string): Promise<Workflow> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid workflow ID');
    }

    const workflow = await this.workflowModel
      .findOne({
        _id: new Types.ObjectId(id),
        organizationId: new Types.ObjectId(organizationId),
        deletedAt: null,
      })
      .exec();

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return workflow;
  }

  async update(
    id: string,
    updateWorkflowDto: UpdateWorkflowDto,
    userId: string,
    organizationId: string,
  ): Promise<Workflow> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid workflow ID');
    }

    const workflow = await this.workflowModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          organizationId: new Types.ObjectId(organizationId),
          deletedAt: null,
        },
        { 
          ...updateWorkflowDto,
          version: { $inc: 1 }
        },
        { new: true }
      )
      .exec();

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return workflow;
  }

  async remove(id: string, userId: string, organizationId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid workflow ID');
    }

    const result = await this.workflowModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          organizationId: new Types.ObjectId(organizationId),
          deletedAt: null,
        },
        { deletedAt: new Date() },
        { new: true }
      )
      .exec();

    if (!result) {
      throw new NotFoundException('Workflow not found');
    }
  }

  async duplicate(
    id: string,
    userId: string,
    organizationId: string,
    name?: string,
  ): Promise<Workflow> {
    const originalWorkflow = await this.findOne(id, userId, organizationId);
    
    const duplicatedWorkflow = new this.workflowModel({
      ...originalWorkflow.toObject(),
      _id: undefined,
      name: name || `${originalWorkflow.name} (Copy)`,
      userId: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(organizationId),
      executionCount: 0,
      lastExecutedAt: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    });

    return duplicatedWorkflow.save();
  }

  async getWorkflowNodes(
    workflowId: string,
    userId: string,
    organizationId: string,
  ): Promise<WorkflowNode[]> {
    // Verify workflow exists and user has access
    await this.findOne(workflowId, userId, organizationId);

    return this.workflowNodeModel
      .find({ 
        workflowId: new Types.ObjectId(workflowId),
        deletedAt: null 
      })
      .sort({ position: 1 })
      .exec();
  }

  async getWorkflowConnections(
    workflowId: string,
    userId: string,
    organizationId: string,
  ): Promise<WorkflowNodeConnection[]> {
    // Verify workflow exists and user has access
    await this.findOne(workflowId, userId, organizationId);

    return this.connectionModel
      .find({ 
        workflowId: new Types.ObjectId(workflowId),
        deletedAt: null 
      })
      .exec();
  }

  async updateWorkflowStatus(
    id: string,
    status: string,
    userId: string,
    organizationId: string,
  ): Promise<Workflow> {
    return this.update(id, { status } as any, userId, organizationId);
  }

  async incrementExecutionCount(workflowId: string): Promise<void> {
    await this.workflowModel
      .findByIdAndUpdate(
        workflowId,
        { 
          $inc: { executionCount: 1 },
          lastExecutedAt: new Date()
        }
      )
      .exec();
  }
}