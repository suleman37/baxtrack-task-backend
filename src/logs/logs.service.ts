import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Table, TableColumn } from 'typeorm';
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
  private ensureSchemaPromise: Promise<void> | null = null;

  constructor(
    private readonly dataSource: DataSource,
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
      await this.ensureLogsTable();
      const metadata = await this.resolveLogMetadata(payload);
      await this.logsRepository.save(
        this.logsRepository.create({
          action,
          actorId: metadata.actorId,
          createdById: metadata.createdById,
          createdByName: metadata.createdByName,
          userId: metadata.userId,
          userName: metadata.userName,
          organizationId: metadata.organizationId,
          organizationName: metadata.organizationName,
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
    await this.ensureLogsTable();
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
      action: this.formatAction(log.action),
      actorId: log.actorId,
      createdById: log.createdById,
      createdByName: log.createdByName,
      userId: log.userId,
      userName: log.userName,
      organizationId: log.organizationId,
      organizationName: log.organizationName,
      details: log.details,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    };
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }

  private formatAction(action: string): string {
    const normalizedAction = action.trim().replace(/_/g, ' ');

    if (normalizedAction.length === 0) {
      return action;
    }

    return normalizedAction.charAt(0).toUpperCase() + normalizedAction.slice(1);
  }

  private async ensureLogsTable(): Promise<void> {
    if (this.ensureSchemaPromise) {
      return this.ensureSchemaPromise;
    }

    this.ensureSchemaPromise = this.syncLogsTable().finally(() => {
      this.ensureSchemaPromise = null;
    });

    return this.ensureSchemaPromise;
  }

  private async syncLogsTable(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    try {
      const hasLogsTable = await queryRunner.hasTable('logs');

      if (!hasLogsTable) {
        await queryRunner.createTable(
          new Table({
            name: 'logs',
            columns: [
              {
                name: 'id',
                type: 'integer',
                isPrimary: true,
                isGenerated: true,
                generationStrategy: 'increment',
              },
              {
                name: 'action',
                type: 'varchar',
                isNullable: false,
              },
              {
                name: 'actorId',
                type: 'integer',
                isNullable: true,
              },
              {
                name: 'userId',
                type: 'integer',
                isNullable: true,
              },
              {
                name: 'organizationId',
                type: 'integer',
                isNullable: true,
              },
              {
                name: 'details',
                type: 'text',
                isNullable: true,
              },
              {
                name: 'createdAt',
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP',
                isNullable: false,
              },
            ],
          }),
          true,
        );

        this.logger.log('Created missing "logs" table automatically.');
        return;
      }

      const table = await queryRunner.getTable('logs');

      if (!table) {
        return;
      }

      const missingColumns: TableColumn[] = [];

      if (!table.findColumnByName('action')) {
        missingColumns.push(
          new TableColumn({
            name: 'action',
            type: 'varchar',
            isNullable: false,
            default: "''",
          }),
        );
      }

      if (!table.findColumnByName('actorId')) {
        missingColumns.push(
          new TableColumn({
            name: 'actorId',
            type: 'integer',
            isNullable: true,
          }),
        );
      }

      if (!table.findColumnByName('createdById')) {
        missingColumns.push(
          new TableColumn({
            name: 'createdById',
            type: 'integer',
            isNullable: true,
          }),
        );
      }

      if (!table.findColumnByName('createdByName')) {
        missingColumns.push(
          new TableColumn({
            name: 'createdByName',
            type: 'varchar',
            isNullable: false,
            default: "'Unknown'",
          }),
        );
      }

      if (!table.findColumnByName('userId')) {
        missingColumns.push(
          new TableColumn({
            name: 'userId',
            type: 'integer',
            isNullable: true,
          }),
        );
      }

      if (!table.findColumnByName('userName')) {
        missingColumns.push(
          new TableColumn({
            name: 'userName',
            type: 'varchar',
            isNullable: true,
          }),
        );
      }

      if (!table.findColumnByName('organizationId')) {
        missingColumns.push(
          new TableColumn({
            name: 'organizationId',
            type: 'integer',
            isNullable: true,
          }),
        );
      }

      if (!table.findColumnByName('organizationName')) {
        missingColumns.push(
          new TableColumn({
            name: 'organizationName',
            type: 'varchar',
            isNullable: true,
          }),
        );
      }

      if (!table.findColumnByName('details')) {
        missingColumns.push(
          new TableColumn({
            name: 'details',
            type: 'varchar',
            isNullable: true,
          }),
        );
      }

      if (!table.findColumnByName('createdAt')) {
        missingColumns.push(
          new TableColumn({
            name: 'createdAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          }),
        );
      }

      if (!table.findColumnByName('updatedAt')) {
        missingColumns.push(
          new TableColumn({
            name: 'updatedAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          }),
        );
      }

      if (missingColumns.length > 0) {
        await queryRunner.addColumns('logs', missingColumns);
        this.logger.warn(
          `Added missing columns to "logs" table: ${missingColumns
            .map((column) => column.name)
            .join(', ')}`,
        );
      }
    } finally {
      await queryRunner.release();
    }
  }

  private async resolveLogMetadata(payload: LogRecordPayload): Promise<{
    actorId: number | null;
    createdById: number | null;
    createdByName: string;
    userId: number | null;
    userName: string | null;
    organizationId: number | null;
    organizationName: string | null;
  }> {
    const actorId = payload.actorId ?? payload.createdById ?? null;
    const userId = payload.userId ?? actorId;
    const organizationId = payload.organizationId ?? null;

    return {
      actorId,
      createdById: actorId,
      createdByName:
        payload.createdByName?.trim() ||
        (actorId != null ? `User ${actorId}` : null) ||
        'Unknown',
      userId,
      userName:
        payload.userName?.trim() ||
        (userId != null ? `User ${userId}` : null),
      organizationId,
      organizationName:
        payload.organizationName?.trim() ||
        (organizationId != null ? `Organization ${organizationId}` : null),
    };
  }
}
