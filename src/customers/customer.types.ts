export interface CreateCustomerPayload {
  name: string;
  email: string;
  phone: string;
  assignedTo: number | string;
}

export interface CreateCustomerNotePayload {
  notes: string;
}

export interface CustomerNote {
  createdById: number | null;
  organizationId: number | null;
  customerId: number;
  notes: string;
}

export interface CustomerResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  organizationId: number | null;
  createdById: number | null;
  notes: CustomerNote[];
  status: string;
  assignedTo: number;
  assignedToName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerMutationResponse {
  message: string;
}

export interface CustomerPaginationQuery {
  page: number;
  limit: number;
}

export interface CustomerPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedCustomersResponse {
  data: CustomerResponse[];
  pagination: CustomerPaginationMeta;
}
