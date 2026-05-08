export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  Token: string;
  User_ID: number;
  Organization_ID: number | null;
  message: string;
}
