import type { UserRole } from '../enums/user-role.enum';

/** Response for GET /auth/me — use this instead of relying on JWT `organizationId` alone. */
export interface AuthMeResponse {
  userId: number;
  email?: string;
  role: UserRole | null;
  /**
   * From the `users` row (also in JWT). Often `null` for `super_admin` — that is expected.
   */
  organizationId: number | null;
  /**
   * When `role` is `super_admin` and the client sent a valid `X-Organization-Id`,
   * this is the org this request is scoped to. Otherwise `null`.
   * Not populated from JWT; derived from the header on this request.
   */
  actingOrganizationId: number | null;
}
