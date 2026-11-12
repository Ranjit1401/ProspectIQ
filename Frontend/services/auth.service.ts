import { apiFetch, setToken, clearToken } from "./api-client";
import { clearCache } from "@/lib/data-cache";
import { resetWorkspaceStore } from "@/lib/workspace-store";

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

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    clearCache();
    resetWorkspaceStore();
    const result = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    });
    setToken(result.access_token);
    return result;
  },

  async register(payload: RegisterPayload) {
    clearCache();
    resetWorkspaceStore();
    return apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    });
  },

  async me(): Promise<CurrentUser> {
    return apiFetch<CurrentUser>("/auth/me");
  },

  logout() {
    clearToken();
    clearCache();
    resetWorkspaceStore();
  },

  async googleLogin(token: string) {
    clearCache();
    resetWorkspaceStore();
    const result = await apiFetch<AuthResponse>("/auth/google-auth", {
      method: "POST",
      body: JSON.stringify({
        token,
      }),
      auth: false,
    });

    setToken(result.access_token);

    return result;
  },
};
