export const JWT_SECRET = process.env.JWT_SECRET || '';
export const AUTHORIZATION_BEARER_PREFIX = 'Bearer ';
export const TOKEN_HEADER_NAME = 'token';
export const ORGANIZATION_SCOPE_HEADER_NAMES = [
  'x-organization-id',
  'X-Organization-Id',
] as const;
