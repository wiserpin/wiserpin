/**
 * Base error class for storage operations
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Error thrown when database initialization fails
 */
export class DatabaseInitError extends StorageError {
  constructor(message: string, cause?: unknown) {
    super(message, 'DB_INIT_ERROR', cause);
    this.name = 'DatabaseInitError';
  }
}

/**
 * Error thrown when a resource is not found
 */
export class NotFoundError extends StorageError {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Error thrown when storage quota is exceeded
 */
export class QuotaExceededError extends StorageError {
  constructor(message: string = 'Storage quota exceeded') {
    super(message, 'QUOTA_EXCEEDED');
    this.name = 'QuotaExceededError';
  }
}

/**
 * Error thrown when a duplicate entry is detected
 */
export class DuplicateError extends StorageError {
  constructor(resource: string, field: string, value: string) {
    super(
      `${resource} with ${field} '${value}' already exists`,
      'DUPLICATE_ENTRY'
    );
    this.name = 'DuplicateError';
  }
}

/**
 * Error thrown when a transaction fails
 */
export class TransactionError extends StorageError {
  constructor(message: string, cause?: unknown) {
    super(message, 'TRANSACTION_ERROR', cause);
    this.name = 'TransactionError';
  }
}
