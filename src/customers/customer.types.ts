export interface CreateCustomerPayload {
  name: string;
  email: string;
  phone: string;
  assignedTo: number;
}

export interface CustomerResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  organizationId: number | null;
  createdById: number | null;
  assignedTo: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CustomerMutationResponse {
  message: string;
}
