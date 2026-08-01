import { apiFetch, setToken, clearToken } from "./api-client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const result = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    });
    setToken(result.access_token);
    return result;
  },

  async register(payload: RegisterPayload) {
    return apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    });
  },

  logout() {
    clearToken();
  },
};
