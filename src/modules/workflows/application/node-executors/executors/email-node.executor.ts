import { Injectable, Logger } from '@nestjs/common';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../node-executor.interface';

export interface EmailConfig {
  to: string;
  from?: string;
  subject: string;
  template: string;
  context?: Record<string, any>;
}

@Injectable()
export class EmailNodeExecutor implements NodeExecutor {
  private readonly logger = new Logger(EmailNodeExecutor.name);

  constructor() {}

  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>> {
    const config = node.configuration as EmailConfig;
    this.logger.log(`Sending email to: ${config.to}`);

    try {
      const to = this.replaceVariables(config.to, inputData);
      const subject = this.replaceVariables(config.subject, inputData);
      const template = config.template;
      const context = this.replaceVariablesInObject(config.context || {}, inputData);

      // Simulate email sending (replace with actual mailer service)
      this.logger.log(`Simulating email send:
        To: ${to}
        From: ${config.from || 'noreply@weconnect.com'}
        Subject: ${subject}
        Template: ${template}
      `);
      
      // In production, you would use:
      // await this.mailerService.sendMail({ to, from, subject, template, context });

      return {
        ...inputData,
        _email: {
          nodeId: node.id,
          nodeName: node.name,
          to,
          subject,
          template,
        },
        emailStatus: 'sent',
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);

      return {
        ...inputData,
        _email: {
          nodeId: node.id,
          nodeName: node.name,
          to: config.to,
          subject: config.subject,
          template: config.template,
          error: error.message,
        },
        emailStatus: 'failed',
        emailError: error.message,
      };
    }
  }

  async validate(configuration: Record<string, any>): Promise<boolean> {
    const config = configuration as EmailConfig;
    return !!config.to && !!config.subject && !!config.template;
  }

  private replaceVariables(str: string, data: Record<string, any>): string {
    return str.replace(/\{\{([^}]+)}}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = data;

      for (const k of keys) {
        value = value?.[k];
      }

      return value !== undefined ? String(value) : match;
    });
  }

  private replaceVariablesInObject(obj: any, data: Record<string, any>): any {
    if (typeof obj === 'string') {
      return this.replaceVariables(obj, data);
    }

    if (typeof obj === 'object' && obj !== null) {
      const result = Array.isArray(obj) ? [] : {};

      for (const key in obj) {
        result[key] = this.replaceVariablesInObject(obj[key], data);
      }

      return result;
    }

    return obj;
  }
}
