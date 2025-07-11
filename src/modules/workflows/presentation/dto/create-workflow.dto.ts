import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowStatus } from '../../domain/entities/workflow.entity';
import { NodeType } from '../../domain/entities/workflow-node.entity';
import { ConnectionType } from '../../domain/entities/workflow-node-connection.entity';

class CreateWorkflowNodeDto {
  @ApiProperty({ 
    description: 'Node name', 
    example: 'Send Welcome Email' 
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Node type', 
    enum: NodeType,
    example: NodeType.TRIGGER,
    enumName: 'NodeType'
  })
  @IsEnum(NodeType)
  type: NodeType;

  @ApiProperty({ 
    description: 'Node configuration', 
    example: {
      "webhookUrl": "https://example.com/webhook",
      "method": "POST"
    },
    required: false
  })
  @IsOptional()
  configuration?: Record<string, any>;

  @ApiProperty({ 
    description: 'Node position on canvas', 
    example: { "x": 100, "y": 200 },
    required: false
  })
  @IsOptional()
  position?: { x: number; y: number };

  @ApiProperty({ 
    description: 'Execution order', 
    example: 1,
    required: false
  })
  @IsOptional()
  executionOrder?: number;

  @ApiProperty({ 
    description: 'Whether node is enabled', 
    example: true, 
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

class CreateConnectionDto {
  @ApiProperty({ 
    description: 'Source node index (0-based) or temporary ID', 
    example: '0',
    type: 'string'
  })
  @IsString()
  @IsNotEmpty()
  sourceNodeId: string;

  @ApiProperty({ 
    description: 'Target node index (0-based) or temporary ID', 
    example: '1',
    type: 'string'
  })
  @IsString()
  @IsNotEmpty()
  targetNodeId: string;

  @ApiProperty({ 
    description: 'Connection type', 
    enum: ConnectionType,
    example: ConnectionType.MAIN,
    enumName: 'ConnectionType',
    required: false,
    default: ConnectionType.MAIN
  })
  @IsOptional()
  @IsEnum(ConnectionType)
  type?: ConnectionType = ConnectionType.MAIN;

  @ApiProperty({ 
    description: 'Source output index', 
    example: 0,
    required: false,
    default: 0
  })
  @IsOptional()
  @IsNumber()
  sourceOutputIndex?: number = 0;

  @ApiProperty({ 
    description: 'Target input index', 
    example: 0,
    required: false,
    default: 0
  })
  @IsOptional()
  @IsNumber()
  targetInputIndex?: number = 0;
}

export class CreateWorkflowDto {
  @ApiProperty({ 
    description: 'Workflow name', 
    example: 'Email Marketing Campaign' 
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Workflow description', 
    example: 'Automated email marketing workflow with triggers and actions',
    required: false 
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Workflow status', 
    enum: WorkflowStatus,
    example: WorkflowStatus.DRAFT,
    enumName: 'WorkflowStatus',
    required: false 
  })
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @ApiProperty({ 
    description: 'Workflow configuration', 
    example: {
      "timeout": 30000,
      "retryAttempts": 3
    },
    required: false 
  })
  @IsOptional()
  configuration?: Record<string, any>;

  @ApiProperty({ 
    description: 'Whether workflow is active', 
    example: false,
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ 
    description: 'Workflow nodes', 
    type: [CreateWorkflowNodeDto], 
    required: false,
    example: [
      {
        "name": "Email Trigger",
        "type": "trigger",
        "configuration": {},
        "position": { "x": 100, "y": 100 }
      },
      {
        "name": "Send Email",
        "type": "email",
        "configuration": {
          "to": "user@example.com",
          "subject": "Welcome!"
        },
        "position": { "x": 300, "y": 100 }
      }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowNodeDto)
  nodes?: CreateWorkflowNodeDto[];

  @ApiProperty({ 
    description: 'Node connections (use array indices as sourceNodeId/targetNodeId)', 
    type: [CreateConnectionDto], 
    required: false,
    example: [
      {
        "sourceNodeId": "0",
        "targetNodeId": "1",
        "type": "main"
      }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateConnectionDto)
  connections?: CreateConnectionDto[];
}
