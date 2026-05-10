import type {
  PaginatedResponse,
} from '../common/pagination.types';

export interface LogRecordPayload {
  action: string;
  actorId?: number | null;
  userId?: number | null;
  organizationId?: number | null;
  details?: string | null;
}

export interface LogResponse {
  id: number;
  action: string;
  actorId: number | null;
  userId: number | null;
  organizationId: number | null;
  details: string | null;
  createdAt: Date;
}

export type PaginatedLogsResponse = PaginatedResponse<LogResponse>;
