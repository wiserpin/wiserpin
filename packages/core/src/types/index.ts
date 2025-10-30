// Collection types
export type {
  Collection,
  CreateCollectionInput,
  UpdateCollectionInput,
} from './collection';

// Page and Summary types
export type { PagePreview, Summary } from './page';

// Pin types
export type { Pin, CreatePinInput, UpdatePinInput } from './pin';

// Settings types
export type { Settings } from './settings';
export { DEFAULT_SETTINGS } from './settings';

// Messaging types
export {
  MessageType,
  type BaseMessage,
  type GetPageMetadataMessage,
  type PageMetadataResponseMessage,
  type GenerateSummaryMessage,
  type SummaryResponseMessage,
  type ErrorMessage,
  type ExtensionMessage,
} from './messaging';

// Storage types
export {
  StorageEventType,
  type StorageResult,
  type StorageSchema,
  type QueryOptions,
  type PinFilter,
  type StorageEvent,
} from './storage';

// API types
export {
  CollectionApi,
  PinApi,
  type ApiResponse,
  type ApiError,
  type ResponseMeta,
  type PaginationParams,
} from './api';
