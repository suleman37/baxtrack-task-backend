export interface CreateCustomerPayload {
  id: number;
  name: string;
  email: string;
  phone: string;
  organizationId: number;
  assignedTo: number;
}

export interface CustomerResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  organizationId: number;
  assignedTo: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CustomerMutationResponse {
  message: string;
}
