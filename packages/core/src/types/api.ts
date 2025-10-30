import type { Collection, CreateCollectionInput, UpdateCollectionInput } from './collection';
import type { Pin, CreatePinInput, UpdatePinInput } from './pin';

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Response metadata (pagination, etc.)
 */
export interface ResponseMeta {
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Collection API endpoints
 */
export namespace CollectionApi {
  export type ListResponse = ApiResponse<Collection[]>;
  export type GetResponse = ApiResponse<Collection>;
  export type CreateRequest = CreateCollectionInput;
  export type CreateResponse = ApiResponse<Collection>;
  export type UpdateRequest = UpdateCollectionInput;
  export type UpdateResponse = ApiResponse<Collection>;
  export type DeleteResponse = ApiResponse<{ id: string }>;
}

/**
 * Pin API endpoints
 */
export namespace PinApi {
  export type ListResponse = ApiResponse<Pin[]>;
  export type GetResponse = ApiResponse<Pin>;
  export type CreateRequest = CreatePinInput;
  export type CreateResponse = ApiResponse<Pin>;
  export type UpdateRequest = UpdatePinInput;
  export type UpdateResponse = ApiResponse<Pin>;
  export type DeleteResponse = ApiResponse<{ id: string }>;

  export interface ListParams extends PaginationParams {
    collectionId?: string;
    search?: string;
  }
}
