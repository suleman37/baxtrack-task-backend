import { Controller, Get, Query, Req } from '@nestjs/common';
import { getAccessActorOrThrow } from '../common/auth/access-context.util';
import { parsePaginationQuery } from '../common/utils/pagination.util';
import type { AuthenticatedRequest } from '../types/http/authenticated-request.types';
import type { PaginatedLogsResponse } from '../types/logs/log.types';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  findAll(
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<PaginatedLogsResponse> {
    return this.logsService.findAll(
      getAccessActorOrThrow(request),
      parsePaginationQuery(page, limit),
    );
  }
}
