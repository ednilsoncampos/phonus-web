export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RefreshRequest {
  refreshToken: string;
}
