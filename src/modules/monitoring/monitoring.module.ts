import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringService } from './application/services/monitoring.service';
import { MetricsService } from './application/services/metrics.service';
import { AlertingService } from './application/services/alerting.service';
import { AuditLogService } from './application/services/audit-log.service';
import { MonitoringController } from './presentation/controllers/monitoring.controller';
import { ExecutionMetric } from './domain/entities/execution-metric.entity';
import { SystemMetric } from './domain/entities/system-metric.entity';
import { Alert } from './domain/entities/alert.entity';
import { AuditLog } from './domain/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExecutionMetric,
      SystemMetric,
      Alert,
      AuditLog,
    ]),
  ],
  controllers: [MonitoringController],
  providers: [
    MonitoringService,
    MetricsService,
    AlertingService,
    AuditLogService,
  ],
  exports: [
    MonitoringService,
    MetricsService,
    AlertingService,
    AuditLogService,
  ],
})
export class MonitoringModule {}
