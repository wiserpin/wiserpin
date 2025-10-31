/**
 * API Client for WiserPin Extension
 *
 * Communicates with the WiserPin API with automatic Clerk token injection
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
 * Get the Clerk session token from chrome storage
 */
async function getSessionToken(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(['clerk_session_token']);
    return result.clerk_session_token || null;
  } catch (error) {
    console.error('Failed to get session token:', error);
    return null;
  }
}

/**
 * Make an authenticated API request
 */
async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getSessionToken();

  const headers = new Headers(options.headers);

  // Add authentication token if available
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Add content type for JSON requests
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE_URL}${endpoint}`;

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
    return (data.data || data) as T;
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

export const api = {
  // Collections
  collections: {
    list: () => request('/collections'),
    get: (id: string) => request(`/collections/${id}`),
    create: (data: any) => request('/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request(`/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/collections/${id}`, {
      method: 'DELETE',
    }),
  },

  // Pins
  pins: {
    list: (collectionId?: string) => {
      const params = collectionId ? `?collectionId=${collectionId}` : '';
      return request(`/pins${params}`);
    },
    get: (id: string) => request(`/pins/${id}`),
    create: (data: any) => request('/pins', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request(`/pins/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/pins/${id}`, {
      method: 'DELETE',
    }),
  },

  // Health check
  health: () => request('/health'),
};

export { ApiError };
