import type {
  PaginatedResponse,
} from '../common/pagination.types';

export interface LogRecordPayload {
  action: string;
  actorId?: number | null;
  createdById?: number | null;
  createdByName?: string | null;
  userId?: number | null;
  userName?: string | null;
  organizationId?: number | null;
  organizationName?: string | null;
  details?: string | null;
}

export interface LogResponse {
  id: number;
  action: string;
  actorId: number | null;
  createdById: number | null;
  createdByName: string;
  userId: number | null;
  userName: string | null;
  organizationId: number | null;
  organizationName: string | null;
  details: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PaginatedLogsResponse = PaginatedResponse<LogResponse>;
