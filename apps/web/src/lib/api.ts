/**
 * API Client for WiserPin
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type TokenGetter = () => Promise<string | null>;

class ApiClient {
  private tokenGetter: TokenGetter | null = null;

  setTokenGetter(getter: TokenGetter) {
    this.tokenGetter = getter;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    // Always get a fresh token for each request
    const token = this.tokenGetter ? await this.tokenGetter() : null;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // If we get a 401 (Unauthorized) and haven't retried yet, try once more with a fresh token
    if (response.status === 401 && retryCount === 0) {
      console.log('[API] Token expired, retrying with fresh token...');
      return this.request<T>(endpoint, options, retryCount + 1);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Pins
  async getPins(collectionId?: string) {
    const query = collectionId ? `?collectionId=${collectionId}` : '';
    return this.request<any[]>(`/pins${query}`);
  }

  async getPin(id: string) {
    return this.request<any>(`/pins/${id}`);
  }

  async createPin(data: any) {
    return this.request<any>('/pins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePin(id: string, data: any) {
    return this.request<any>(`/pins/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePin(id: string) {
    return this.request<void>(`/pins/${id}`, {
      method: 'DELETE',
    });
  }

  // Collections
  async getCollections() {
    return this.request<any[]>('/collections');
  }

  async getCollection(id: string) {
    return this.request<any>(`/collections/${id}`);
  }

  async createCollection(data: any) {
    return this.request<any>('/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCollection(id: string, data: any) {
    return this.request<any>(`/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCollection(id: string) {
    return this.request<void>(`/collections/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
