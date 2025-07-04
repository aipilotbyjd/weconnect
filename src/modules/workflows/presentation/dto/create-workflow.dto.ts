import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowStatus } from '../../domain/entities/workflow.entity';
import { NodeType } from '../../domain/entities/workflow-node.entity';
import { ConnectionType } from '../../domain/entities/workflow-node-connection.entity';

class CreateWorkflowNodeDto {
  @ApiProperty({ description: 'Node name', example: 'Send Welcome Email' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Node type', enum: NodeType })
  @IsEnum(NodeType)
  type: NodeType;

  @ApiProperty({ description: 'Node configuration', example: {} })
  @IsOptional()
  configuration?: Record<string, any>;

  @ApiProperty({ description: 'Node position', example: { x: 100, y: 200 } })
  @IsOptional()
  position?: { x: number; y: number };

  @ApiProperty({ description: 'Execution order', example: 1 })
  @IsOptional()
  executionOrder?: number;

  @ApiProperty({ description: 'Whether node is enabled', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

class CreateConnectionDto {
  @ApiProperty({ description: 'Source node ID or temporary ID' })
  @IsString()
  @IsNotEmpty()
  sourceNodeId: string;

  @ApiProperty({ description: 'Target node ID or temporary ID' })
  @IsString()
  @IsNotEmpty()
  targetNodeId: string;

  @ApiProperty({ 
    description: 'Connection type', 
    enum: ConnectionType,
    default: ConnectionType.MAIN,
  })
  @IsOptional()
  @IsEnum(ConnectionType)
  type?: ConnectionType = ConnectionType.MAIN;

  @ApiProperty({ description: 'Source output index', default: 0 })
  @IsOptional()
  @IsNumber()
  sourceOutputIndex?: number = 0;

  @ApiProperty({ description: 'Target input index', default: 0 })
  @IsOptional()
  @IsNumber()
  targetInputIndex?: number = 0;
}

export class CreateWorkflowDto {
  @ApiProperty({ description: 'Workflow name', example: 'Email Marketing Campaign' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Workflow description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Workflow status', enum: WorkflowStatus, required: false })
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @ApiProperty({ description: 'Workflow configuration', required: false })
  @IsOptional()
  configuration?: Record<string, any>;

  @ApiProperty({ description: 'Whether workflow is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Workflow nodes', type: [CreateWorkflowNodeDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowNodeDto)
  nodes?: CreateWorkflowNodeDto[];

  @ApiProperty({ description: 'Node connections', type: [CreateConnectionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateConnectionDto)
  connections?: CreateConnectionDto[];
}
