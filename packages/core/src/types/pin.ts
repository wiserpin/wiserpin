import type { PagePreview, Summary } from './page';

/**
 * Pin represents a saved page in a collection
 */
export interface Pin {
  /** Unique identifier */
  id: string;

  /** User ID (for cloud sync, optional in MVP) */
  userId?: string;

  /** ID of the collection this pin belongs to */
  collectionId: string;

  /** Page metadata */
  page: PagePreview;

  /** AI-generated summary (if auto-summarize enabled) */
  summary?: Summary;

  /** User's personal note about this pin */
  note?: string;

  /** ISO timestamp of creation */
  createdAt: string;
}

/**
 * Input type for creating a new pin
 */
export type CreatePinInput = Omit<Pin, 'id' | 'createdAt'>;

/**
 * Input type for updating a pin
 */
export type UpdatePinInput = Partial<Omit<Pin, 'id' | 'userId' | 'collectionId' | 'createdAt'>>;
