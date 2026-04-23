export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserProfile;
}

export interface LogoutResponse {
  message: string;
}

export interface UserProfile {
  id: number;
  email: string;
  role: string;
  name?: string;
}

export interface DeleteLoanResponse {
  message: string;
}

export interface GetLoansByEmailResponse {
  loans: Loan[];
}

export type LoanStatus = 'pending' | 'active' | 'expired';

export interface Loan {
  id: string;
  userEmail: string;
  amount: number;
  status: LoanStatus;
  maturityDate: string;
  totalLoan?: number; 
}

export interface ApiClientOptions {
  baseUrl?: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class LoanApiClient {
  private baseUrl: string;
  private getToken?: () => string | null;
  private onUnauthorized?: () => void;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? 'http://localhost:3000').replace(/\/+$/, '');
    this.getToken = options.getToken;
    this.onUnauthorized = options.onUnauthorized;
  }


  async login(payload: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async logout(): Promise<LogoutResponse> {
    return this.request<LogoutResponse>('/logout', {
      method: 'POST',
      requiresAuth: true,
    });
  }

  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/profile', {
      requiresAuth: true,
    });
  }


  async getLoans(status?: LoanStatus): Promise<Loan[]> {
    const query = status ? `?status=${status}` : '';
    return this.request<Loan[]>(`/loans${query}`, {
      requiresAuth: true,
    });
  }

  async getExpiredLoans(): Promise<Loan[]> {
    return this.request<Loan[]>('/loans/expired', {
      requiresAuth: true,
    });
  }

  async getLoansByEmail(userEmail: string): Promise<GetLoansByEmailResponse> {
    return this.request<GetLoansByEmailResponse>(
      `/loans/${encodeURIComponent(userEmail)}/get`,
      { requiresAuth: true },
    );
  }

  async deleteLoan(loanId: string): Promise<DeleteLoanResponse> {
    return this.request<DeleteLoanResponse>(
      `/loan/${encodeURIComponent(loanId)}/delete`,
      {
        method: 'DELETE',
        requiresAuth: true,
      },
    );
  }


  private async request<T>(
    path: string,
    options: RequestInit & { requiresAuth?: boolean } = {},
  ): Promise<T> {
    const headers = new Headers(options.headers);

    headers.set('Content-Type', 'application/json');

    if (options.requiresAuth) {
      const token = this.getToken?.();

      if (!token) {
        throw new ApiClientError('Missing authentication token', 401);
      }

      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    const data = await this.parseResponse(response);

    if (!response.ok) {
      if (response.status === 401) {
        this.onUnauthorized?.();
      }

      throw new ApiClientError(
        this.extractMessage(data) ?? 'Request failed',
        response.status,
        data,
      );
    }

    return data as T;
  }


  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();
    return text ? { message: text } : null;
  }

  private extractMessage(data: unknown): string | null {
    if (!data || typeof data !== 'object') return null;

    const msg = (data as any).message;

    if (typeof msg === 'string') return msg;

    if (Array.isArray(msg)) return msg.join(', ');

    return null;
  }
}
