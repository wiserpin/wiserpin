import type { Collection } from '@wiserpin/core';
import { Button } from '@wiserpin/ui';

interface CollectionSelectorProps {
  collections: Collection[];
  selectedCollectionId: string;
  onSelectCollection: (collectionId: string, collectionName: string) => void;
  onBack: () => void;
  onCreateCollection: () => void;
}

export function CollectionSelector({
  collections,
  selectedCollectionId,
  onSelectCollection,
  onBack,
  onCreateCollection,
}: CollectionSelectorProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700" style={{ padding: '16px' }}>
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Collection</h2>
        </div>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px' }}>
        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4"
            >
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">No collections yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-[280px]">
              Create your first collection to start organizing your pins
            </p>
            <Button onClick={onCreateCollection}>
              Create Collection
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => onSelectCollection(collection.id, collection.name)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedCollectionId === collection.id
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: collection.color || '#3b82f6' }}
                    />
                    <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">
                      {collection.name}
                    </h3>
                  </div>
                  {selectedCollectionId === collection.id && (
                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 ml-8">
                  {collection.goal}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Create New Button */}
      {collections.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: 'white',
          }}
        >
          <Button
            variant="outline"
            onClick={onCreateCollection}
            className="w-full"
          >
            + Create New Collection
          </Button>
        </div>
      )}
    </div>
  );
}
