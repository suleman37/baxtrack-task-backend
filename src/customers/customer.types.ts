export interface CreateCustomerPayload {
  name: string;
  email: string;
  phone: string;
  assignedTo: number | string;
}

export interface CustomerResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  organizationId: number | null;
  createdById: number | null;
  status: string;
  assignedTo: number;
  assignedToName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerMutationResponse {
  message: string;
}
