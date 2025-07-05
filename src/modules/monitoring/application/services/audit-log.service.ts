import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '../../domain/entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: {
    action: AuditAction;
    entityType: string;
    entityId: string;
    userId: string;
    userEmail: string;
    ipAddress?: string;
    userAgent?: string;
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
    organizationId?: string;
  }): Promise<AuditLog> {
    return this.auditLogRepository.save(data);
  }

  async getAuditLogs(filters: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    organizationId?: string;
  }): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('audit');

    if (filters.userId) {
      query.andWhere('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters.entityType) {
      query.andWhere('audit.entityType = :entityType', { entityType: filters.entityType });
    }

    if (filters.entityId) {
      query.andWhere('audit.entityId = :entityId', { entityId: filters.entityId });
    }

    if (filters.action) {
      query.andWhere('audit.action = :action', { action: filters.action });
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('audit.performedAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters.organizationId) {
      query.andWhere('audit.organizationId = :organizationId', { 
        organizationId: filters.organizationId 
      });
    }

    return query.orderBy('audit.performedAt', 'DESC').getMany();
  }
}
