import { useState, useEffect } from 'react';
import type { Collection } from '@wiserpin/core';
import { deleteCollection, listPinsByCollection } from '@wiserpin/storage';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@wiserpin/ui';

interface CollectionListProps {
  collections: Collection[];
  onCollectionChanged: () => Promise<void>;
  onCreateCollection: () => void;
}

export function CollectionList({ collections, onCollectionChanged, onCreateCollection }: CollectionListProps) {
  const [pinCounts, setPinCounts] = useState<Record<string, number>>({});

  // Load pin counts for each collection
  useEffect(() => {
    loadPinCounts();
  }, [collections]);

  const loadPinCounts = async () => {
    const counts: Record<string, number> = {};
    for (const collection of collections) {
      const pins = await listPinsByCollection(collection.id);
      counts[collection.id] = pins.length;
    }
    setPinCounts(counts);
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection? All pins in it will also be deleted.')) {
      return;
    }

    try {
      await deleteCollection(id);
      await onCollectionChanged();
    } catch (error) {
      console.error('Failed to delete collection:', error);
      alert('Failed to delete collection');
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Collections</h2>
          <Button
            size="sm"
            onClick={onCreateCollection}
          >
            + New Collection
          </Button>
        </div>

        {collections.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No collections yet</p>
                <Button onClick={onCreateCollection}>
                  Create Your First Collection
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {collections.map((collection) => (
              <Card key={collection.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: collection.color || '#3b82f6' }}
                      />
                      <CardTitle className="text-base">{collection.name}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCollection(collection.id)}
                      className="h-auto p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </Button>
                  </div>
                  <CardDescription className="text-sm">
                    {collection.goal}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {pinCounts[collection.id] || 0} {pinCounts[collection.id] === 1 ? 'pin' : 'pins'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
