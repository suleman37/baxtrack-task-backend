import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { resolveCustomerOrganizationKey } from '../common/auth/access-context.util';
import type { PaginationQuery } from '../types/common/pagination.types';
import type { AccessActor } from '../types/common/access-context.types';
import type {
  LogRecordPayload,
  LogResponse,
  PaginatedLogsResponse,
} from '../types/logs/log.types';
import { Log } from './log.entity';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(
    @InjectRepository(Log)
    private readonly logsRepository: Repository<Log>,
  ) {}

  async recordAction(payload: LogRecordPayload): Promise<void> {
    if (!payload || typeof payload.action !== 'string') {
      return;
    }

    const action = payload.action.trim();
    if (action.length === 0) {
      return;
    }

    try {
      await this.logsRepository.save(
        this.logsRepository.create({
          action,
          actorId: payload.actorId ?? null,
          userId: payload.userId ?? null,
          organizationId: payload.organizationId ?? null,
          details: payload.details?.trim() || null,
        }),
      );
    } catch (error) {
      this.logger.warn(
        `Unable to persist audit log for action "${action}": ${this.getErrorMessage(error)}`,
      );
    }
  }

  async findAll(
    actor: AccessActor,
    pagination: PaginationQuery,
  ): Promise<PaginatedLogsResponse> {
    const queryBuilder = this.logsRepository.createQueryBuilder('log');
    const orgKey = resolveCustomerOrganizationKey(actor);

    if (orgKey != null) {
      queryBuilder.where('log.organizationId = :orgId', { orgId: orgKey });
    }

    try {
      const [logs, total] = await queryBuilder
        .orderBy('log.id', 'DESC')
        .skip((pagination.page - 1) * pagination.limit)
        .take(pagination.limit)
        .getManyAndCount();

      return {
        data: logs.map((log) => this.toLogResponse(log)),
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / pagination.limit),
        },
      };
    } catch (error) {
      this.logger.warn(
        `Unable to query audit logs: ${this.getErrorMessage(error)}`,
      );

      return {
        data: [],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  private toLogResponse(log: Log): LogResponse {
    return {
      id: log.id,
      action: log.action,
      actorId: log.actorId,
      userId: log.userId,
      organizationId: log.organizationId,
      details: log.details,
      createdAt: log.createdAt,
    };
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}
