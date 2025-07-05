import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertType, AlertSeverity, AlertStatus } from '../../domain/entities/alert.entity';
import { ConfigService } from '@nestjs/config';

// Define a simple interface for email sending
interface EmailService {
  sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void>;
}

interface AlertConfig {
  type: AlertType | string;
  title: string;
  message: string;
  severity?: AlertSeverity;
  metadata?: Record<string, any>;
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private alertChannels: Map<string, (alert: Alert) => Promise<void>>;

  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    private configService: ConfigService,
    @Optional() private emailService?: EmailService,
  ) {
    this.initializeAlertChannels();
  }

  private initializeAlertChannels() {
    this.alertChannels = new Map([
      ['email', this.sendEmailAlert.bind(this)],
      ['slack', this.sendSlackAlert.bind(this)],
      ['webhook', this.sendWebhookAlert.bind(this)],
    ]);
  }

  async sendAlert(config: AlertConfig): Promise<Alert> {
    // Create alert entity first
    const alertEntity = this.alertRepository.create({
      type: config.type as AlertType,
      title: config.title,
      message: config.message,
      severity: config.severity || this.determineSeverity(config.type as AlertType),
      metadata: config.metadata,
      status: AlertStatus.PENDING as AlertStatus,
      channelsNotified: [],
    });

    const alert = await this.alertRepository.save(alertEntity);

    // Get enabled channels from config
    const enabledChannels = this.configService.get<string[]>('alerts.channels') || ['email'];
    
    // Send to all enabled channels
    for (const channel of enabledChannels) {
      try {
        const sender = this.alertChannels.get(channel);
        if (sender) {
          await sender(alert);
          alert.channelsNotified.push(channel);
        }
      } catch (error) {
        this.logger.error(`Failed to send alert via ${channel}:`, error);
      }
    }

    // Update alert status based on notification results
    if (alert.channelsNotified.length > 0) {
      alert.status = AlertStatus.SENT;
    } else {
      alert.status = AlertStatus.PENDING;
    }
    
    return this.alertRepository.save(alert);
  }

  private determineSeverity(type: AlertType): AlertSeverity {
    switch (type) {
      case AlertType.CRITICAL_JOB_FAILURE:
      case AlertType.SYSTEM_DOWN:
      case AlertType.SECURITY_BREACH:
        return AlertSeverity.CRITICAL;
      case AlertType.EXECUTION_TIMEOUT:
      case AlertType.RESOURCE_LIMIT:
        return AlertSeverity.ERROR;
      case AlertType.HIGH_ERROR_RATE:
        return AlertSeverity.WARNING;
      default:
        return AlertSeverity.ERROR;
    }
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    if (!this.emailService) {
      this.logger.warn('Email service not configured, skipping email alert');
      return;
    }

    const recipients = this.configService.get<string[]>('alerts.emailRecipients') || [];
    
    if (recipients.length === 0) {
      this.logger.warn('No email recipients configured for alerts');
      return;
    }

    try {
      await this.emailService.sendMail({
        to: recipients.join(','),
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        html: `
          <h2>${alert.title}</h2>
          <p><strong>Type:</strong> ${alert.type}</p>
          <p><strong>Severity:</strong> ${alert.severity}</p>
          <p><strong>Time:</strong> ${alert.createdAt}</p>
          <p><strong>Message:</strong></p>
          <p>${alert.message}</p>
          ${alert.metadata ? `
            <p><strong>Details:</strong></p>
            <pre>${JSON.stringify(alert.metadata, null, 2)}</pre>
          ` : ''}
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send email alert:', error);
      throw error;
    }
  }

  private async sendSlackAlert(alert: Alert): Promise<void> {
    const webhookUrl = this.configService.get<string>('alerts.slackWebhook');
    
    if (!webhookUrl) {
      this.logger.warn('No Slack webhook configured for alerts');
      return;
    }

    // Implementation would send to Slack
    this.logger.log(`Would send alert to Slack: ${alert.title}`);
  }

  private async sendWebhookAlert(alert: Alert): Promise<void> {
    const webhookUrl = this.configService.get<string>('alerts.webhookUrl');
    
    if (!webhookUrl) {
      return;
    }

    // Implementation would POST to webhook
    this.logger.log(`Would send alert to webhook: ${alert.title}`);
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<Alert> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });
    
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    return this.alertRepository.save(alert);
  }

  async resolveAlert(
    alertId: string,
    userId: string,
    resolutionNotes?: string,
  ): Promise<Alert> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });
    
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedBy = userId;
    alert.resolvedAt = new Date();
    alert.resolutionNotes = resolutionNotes;

    return this.alertRepository.save(alert);
  }

  async getActiveAlerts(severity?: AlertSeverity): Promise<Alert[]> {
    const query = this.alertRepository.createQueryBuilder('alert')
      .where('alert.status IN (:...statuses)', {
        statuses: [AlertStatus.PENDING, AlertStatus.SENT, AlertStatus.ACKNOWLEDGED],
      });

    if (severity) {
      query.andWhere('alert.severity = :severity', { severity });
    }

    return query.orderBy('alert.createdAt', 'DESC').getMany();
  }
}
