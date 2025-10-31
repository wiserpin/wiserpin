/**
 * @wiserpin/storage
 *
 * IndexedDB storage layer for local data persistence
 */

// Database initialization
export { initDB, getDB, closeDB, clearAllData, DB_NAME, DB_VERSION } from './db/schema';

// Collection operations
export {
  addCollection,
  getCollection,
  listCollections,
  listCollectionsByUser,
  updateCollection,
  deleteCollection,
  getCollectionCount,
} from './operations/collections';

// Pin operations
export {
  addPin,
  getPin,
  listPins,
  listPinsByCollection,
  listPinsByUser,
  queryPins,
  updatePin,
  deletePin,
  deletePinsByCollection,
  getPinCount,
  getPinCountByCollection,
  checkPinExists,
} from './operations/pins';

// Settings operations
export {
  getSettings,
  updateSettings,
  resetSettings,
} from './operations/settings';

// Error types
export {
  StorageError,
  DatabaseInitError,
  NotFoundError,
  QuotaExceededError,
  DuplicateError,
  TransactionError,
} from './errors/storage-error';
