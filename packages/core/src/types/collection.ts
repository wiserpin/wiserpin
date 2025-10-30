/**
 * Collection represents a themed group of pins
 */
export interface Collection {
  /** Unique identifier */
  id: string;

  /** User ID (for cloud sync, optional in MVP) */
  userId?: string;

  /** Display name of the collection */
  name: string;

  /** Optional color theme for the collection */
  color?: string;

  /** Goal or purpose of this collection */
  goal: string;

  /** ISO timestamp of creation */
  createdAt: string;

  /** ISO timestamp of last update */
  updatedAt: string;
}

/**
 * Input type for creating a new collection
 */
export type CreateCollectionInput = Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating a collection
 */
export type UpdateCollectionInput = Partial<Omit<Collection, 'id' | 'userId' | 'createdAt'>>;
