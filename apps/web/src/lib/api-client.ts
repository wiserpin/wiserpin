/**
 * API Client with Clerk authentication
 *
 * This utility provides a fetch wrapper that automatically injects
 * Clerk authentication tokens into API requests.
 */

interface ApiClientOptions extends RequestInit {
  getToken: () => Promise<string | null>;
}

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Creates an authenticated API client with Clerk token injection
 *
 * @param baseUrl - The base URL for the API
 * @param getToken - Function to get the Clerk session token
 * @returns Fetch wrapper with authentication
 */
export function createApiClient(baseUrl: string, getToken: () => Promise<string | null>) {
  async function request<T = unknown>(
    endpoint: string,
    options: Omit<ApiClientOptions, 'getToken'> = {}
  ): Promise<T> {
    const token = await getToken();

    const headers = new Headers(options.headers);

    // Add authentication token
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Add content type for JSON requests
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const url = `${baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      // Handle empty responses
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }

      const data: ApiResponse<T> = await response.json();
      return data.data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'An unknown error occurred',
        0,
        error
      );
    }
  }

  return {
    get: <T = unknown>(endpoint: string, options?: Omit<ApiClientOptions, 'getToken' | 'body' | 'method'>) =>
      request<T>(endpoint, { ...options, method: 'GET' }),

    post: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiClientOptions, 'getToken' | 'body' | 'method'>) =>
      request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),

    put: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiClientOptions, 'getToken' | 'body' | 'method'>) =>
      request<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      }),

    patch: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiClientOptions, 'getToken' | 'body' | 'method'>) =>
      request<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      }),

    delete: <T = unknown>(endpoint: string, options?: Omit<ApiClientOptions, 'getToken' | 'body' | 'method'>) =>
      request<T>(endpoint, { ...options, method: 'DELETE' }),
  };
}

/**
 * Hook to create an authenticated API client with Clerk
 *
 * Usage:
 * ```tsx
 * import { useAuth } from '@clerk/clerk-react';
 * import { createApiClient } from './lib/api-client';
 *
 * function MyComponent() {
 *   const { getToken } = useAuth();
 *   const api = createApiClient('https://api.example.com', getToken);
 *
 *   // Use the API client
 *   const data = await api.get('/users/me');
 * }
 * ```
 */
