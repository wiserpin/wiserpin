import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label } from '@wiserpin/ui';
import { FolderOpen, Trash2, Loader2, Plus, Edit } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '@clerk/clerk-react';

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
];

interface CollectionData {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: string;
  _count?: {
    pins: number;
  };
}

export function CollectionsPage() {
  const { isSignedIn, getToken } = useAuth();
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  });

  useEffect(() => {
    // Set up token getter for API client
    api.setTokenGetter(async () => {
      try {
        return await getToken();
      } catch (error) {
        console.error('Failed to get token:', error);
        return null;
      }
    });

    if (isSignedIn) {
      loadCollections();
    }
  }, [isSignedIn, getToken]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this collection? This will not delete the pins inside.')) {
      return;
    }

    try {
      await api.deleteCollection(id);
      setCollections(collections.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete collection:', err);
      alert('Failed to delete collection');
    }
  };

  const handleOpenDialog = (collection?: CollectionData) => {
    if (collection) {
      setEditingCollection(collection);
      setFormData({
        name: collection.name,
        description: collection.description || '',
        color: collection.color || '#3b82f6',
      });
    } else {
      setEditingCollection(null);
      setFormData({
        name: '',
        description: '',
        color: '#3b82f6',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCollection(null);
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a collection name');
      return;
    }

    try {
      if (editingCollection) {
        // Update existing collection
        const updated = await api.updateCollection(editingCollection.id, formData);
        setCollections(collections.map(c => c.id === updated.id ? updated : c));
      } else {
        // Create new collection
        const created = await api.createCollection(formData);
        setCollections([created, ...collections]);
      }
      handleCloseDialog();
    } catch (err) {
      console.error('Failed to save collection:', err);
      alert(err instanceof Error ? err.message : 'Failed to save collection');
    }
  };

  if (!isSignedIn) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your collections</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Collections</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadCollections}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Collections</h1>
            <p className="text-muted-foreground mt-2">
              {collections.length === 0 ? 'Organize your pins into collections' : `${collections.length} ${collections.length === 1 ? 'collection' : 'collections'}`}
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            New Collection
          </Button>
        </div>

        {collections.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Collections Yet</CardTitle>
              <CardDescription>
                Create collections to organize your pins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                  <FolderOpen className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first collection to start organizing your pins, or use the browser extension to sync existing collections.
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  Your collections will appear here once you create them.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Card key={collection.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: collection.color || '#3b82f6',
                        }}
                      />
                      <div>
                        <CardTitle className="line-clamp-1">{collection.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {collection._count?.pins || 0} pins
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(collection)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(collection.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {collection.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {collection.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCollection ? 'Edit Collection' : 'Create New Collection'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="My Collection"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="What this collection is about..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c.value })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === c.value ? 'border-gray-900 dark:border-gray-100 scale-110' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCollection ? 'Save Changes' : 'Create Collection'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
