export const CUSTOMER_STATUSES = ['active', 'deleted'] as const;

export const CUSTOMER_STATUS = {
  ACTIVE: CUSTOMER_STATUSES[0],
  DELETED: CUSTOMER_STATUSES[1],
} as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
