import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    /**
     * Set by auth middleware when `super_admin` sends a valid org scope
     * (header or query). Omitted when unscoped or for non-super-admins.
     */
    organizationScope?: number;
  }
}
