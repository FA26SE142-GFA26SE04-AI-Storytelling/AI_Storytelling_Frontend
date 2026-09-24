export interface VerifyParentalGateRequestDto {
  email: string;
  password: string;
}

export interface ParentalGateResponse {
  success: boolean;
  message?: string;
}
