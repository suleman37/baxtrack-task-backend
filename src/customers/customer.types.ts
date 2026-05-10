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
