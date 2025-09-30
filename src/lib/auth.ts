import { LoginRequest, RegisterRequest, AuthResponse, AuthTokens, User } from '@/types/marketplace';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8085';

class AuthService {
  private static instance: AuthService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private user: User | null = null;
  private refreshPromise: Promise<void> | null = null;

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
      const userStr = localStorage.getItem('user');
      this.user = userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to load auth data from storage:', error);
      this.clearStorage();
    }
  }

  private saveToStorage(tokens: AuthTokens, user: User): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      this.user = user;
    } catch (error) {
      console.error('Failed to save auth data to storage:', error);
    }
  }

  private clearStorage(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
  }

  public async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const authResponse: AuthResponse = await response.json();
      this.saveToStorage(authResponse.tokens, authResponse.user);
      
      return authResponse;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  public async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const authResponse: AuthResponse = await response.json();
      this.saveToStorage(authResponse.tokens, authResponse.user);
      
      return authResponse;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  public async refreshAccessToken(): Promise<void> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const authResponse: AuthResponse = await response.json();
      this.saveToStorage(authResponse.tokens, authResponse.user);
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout();
      throw error;
    }
  }

  public logout(): void {
    this.clearStorage();
    
    // Optional: Call logout endpoint to invalidate tokens on server
    if (this.refreshToken) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      }).catch(error => {
        console.error('Logout endpoint error:', error);
      });
    }
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getUser(): User | null {
    return this.user;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.accessToken && this.user);
  }

  public async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    let token = this.getAccessToken();
    
    if (!token) {
      throw new Error('No access token available');
    }

    // First attempt with current token
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });

    // If token expired, try to refresh and retry
    if (response.status === 401 && this.refreshToken) {
      try {
        await this.refreshAccessToken();
        token = this.getAccessToken();
        
        if (token) {
          response = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${token}`,
            },
          });
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        throw new Error('Authentication failed');
      }
    }

    return response;
  }

  // Utility method to check if token is expired (based on JWT payload)
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp <= now;
    } catch {
      return true;
    }
  }

  // Check if current token needs refresh (within 5 minutes of expiry)
  public shouldRefreshToken(): boolean {
    if (!this.accessToken) return false;
    
    try {
      const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      return timeUntilExpiry <= 300; // 5 minutes
    } catch {
      return true;
    }
  }
}

export const authService = AuthService.getInstance();
export default authService;