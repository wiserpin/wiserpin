import { useState, useEffect } from 'react';
import type { Collection } from '@wiserpin/core';
import { listCollections } from '@wiserpin/storage';
import { Button } from '@wiserpin/ui';
import { PinCreationForm } from './components/PinCreationForm';
import { CollectionList } from './components/CollectionList';
import { CreateCollectionForm } from './components/CreateCollectionForm';
import { CollectionSelector } from './components/CollectionSelector';
import { Settings } from './components/Settings';

export function App() {
  const [view, setView] = useState<'create-pin' | 'collections' | 'create-collection' | 'select-collection' | 'settings'>('create-pin');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [selectedCollectionName, setSelectedCollectionName] = useState<string>('');

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const cols = await listCollections();
      setCollections(cols);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionCreated = async () => {
    await loadCollections();
    setView('collections');
  };

  const handleSelectCollection = (collectionId: string, collectionName: string) => {
    setSelectedCollectionId(collectionId);
    setSelectedCollectionName(collectionName);
    setView('create-pin');
  };

  const handleCollectionCreatedFromSelector = async () => {
    await loadCollections();
    setView('select-collection');
  };

  if (loading) {
    return (
      <div className="w-[400px] min-w-[400px] h-[600px] p-4 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-[400px] min-w-[400px] h-[600px] flex flex-col bg-white dark:bg-gray-900">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b px-4 py-3 bg-indigo-600 dark:bg-indigo-700 text-white flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">WiserPin</h1>
          <p className="text-xs text-indigo-100">Save & organize</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('collections')}
            className={`p-2 rounded-lg transition-colors ${
              view === 'collections' ? 'bg-indigo-500' : 'hover:bg-indigo-500'
            }`}
            title="Collections"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
          </button>
          <button
            onClick={() => setView('settings')}
            className={`p-2 rounded-lg transition-colors ${
              view === 'settings' ? 'bg-indigo-500' : 'hover:bg-indigo-500'
            }`}
            title="Settings"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain"
           style={{
             scrollbarWidth: 'thin',
             scrollbarColor: '#cbd5e1 #f1f5f9'
           }}>
        {view === 'select-collection' ? (
          <CollectionSelector
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onSelectCollection={handleSelectCollection}
            onBack={() => setView('create-pin')}
            onCreateCollection={() => setView('create-collection')}
          />
        ) : view === 'settings' ? (
          <Settings onBack={() => setView('create-pin')} />
        ) : (
          <div className="p-4">
            {view === 'create-pin' && (
              <PinCreationForm
                collections={collections}
                onCollectionCreated={handleCollectionCreated}
                onSelectCollection={() => setView('select-collection')}
                selectedCollectionId={selectedCollectionId}
                selectedCollectionName={selectedCollectionName}
              />
            )}
            {view === 'collections' && (
              <CollectionList
                collections={collections}
                onCollectionChanged={loadCollections}
                onCreateCollection={() => setView('create-collection')}
              />
            )}
            {view === 'create-collection' && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (view === 'create-collection') {
                      // Check if we came from select-collection or collections view
                      const previousView = selectedCollectionId ? 'select-collection' : 'collections';
                      setView(previousView as any);
                    }
                  }}
                  className="mb-4"
                >
                  ← Back
                </Button>
                <CreateCollectionForm
                  onCollectionCreated={
                    selectedCollectionId ? handleCollectionCreatedFromSelector : handleCollectionCreated
                  }
                  onCancel={() => {
                    const previousView = selectedCollectionId ? 'select-collection' : 'collections';
                    setView(previousView as any);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
