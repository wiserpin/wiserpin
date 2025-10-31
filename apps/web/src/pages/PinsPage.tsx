import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@wiserpin/ui';
import { Pin, ExternalLink, Trash2, Loader2, Plus, Edit } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '@clerk/clerk-react';

interface PinData {
  id: string;
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  collection?: {
    id: string;
    name: string;
    color?: string;
  };
}

interface CollectionData {
  id: string;
  name: string;
  color?: string;
}

export function PinsPage() {
  const { isSignedIn, getToken } = useAuth();
  const [pins, setPins] = useState<PinData[]>([]);
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<PinData | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: '',
    imageUrl: '',
    collectionId: '',
  });
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [urlDebounceTimer, setUrlDebounceTimer] = useState<NodeJS.Timeout | null>(null);

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
      loadPins();
      loadCollections();
    }
  }, [isSignedIn, getToken]);

  const loadPins = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPins();
      setPins(data);
    } catch (err) {
      console.error('Failed to load pins:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pins');
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      const data = await api.getCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this pin?')) {
      return;
    }

    try {
      await api.deletePin(id);
      setPins(pins.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete pin:', err);
      alert('Failed to delete pin');
    }
  };

  const handleOpenDialog = (pin?: PinData) => {
    if (pin) {
      setEditingPin(pin);
      setFormData({
        url: pin.url,
        title: pin.title,
        description: pin.description || '',
        imageUrl: pin.imageUrl || '',
        collectionId: pin.collection?.id || '',
      });
    } else {
      setEditingPin(null);
      setFormData({
        url: '',
        title: '',
        description: '',
        imageUrl: '',
        collectionId: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPin(null);
    setFormData({
      url: '',
      title: '',
      description: '',
      imageUrl: '',
      collectionId: '',
    });
    setFetchingMetadata(false);
    if (urlDebounceTimer) {
      clearTimeout(urlDebounceTimer);
      setUrlDebounceTimer(null);
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData({ ...formData, url });

    // Clear existing timer
    if (urlDebounceTimer) {
      clearTimeout(urlDebounceTimer);
    }

    // Show loading state immediately if URL looks valid
    if (url.trim()) {
      try {
        new URL(url);
        setFetchingMetadata(true);
      } catch {
        // Invalid URL, don't show loading
        setFetchingMetadata(false);
      }
    } else {
      setFetchingMetadata(false);
      setFormData(prev => ({ ...prev, title: '', imageUrl: '' }));
      return;
    }

    // Debounce the actual fetch
    const timer = setTimeout(() => {
      fetchUrlMetadata(url);
    }, 800); // 800ms delay after user stops typing

    setUrlDebounceTimer(timer);
  };

  const fetchUrlMetadata = async (url: string) => {
    if (!url.trim()) {
      setFormData(prev => ({ ...prev, title: '', imageUrl: '' }));
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return; // Invalid URL, don't fetch
    }

    setFetchingMetadata(true);
    try {
      // Fetch the URL to get metadata
      const response = await fetch(url, { mode: 'cors' });
      const html = await response.text();

      // Parse HTML to extract metadata
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Get title
      const title =
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        doc.querySelector('title')?.textContent ||
        '';

      // Get image
      const imageUrl =
        doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
        doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
        '';

      // Update form data
      setFormData(prev => ({
        ...prev,
        title: title.trim(),
        imageUrl: imageUrl.trim(),
      }));
    } catch (error) {
      console.error('Failed to fetch URL metadata:', error);
      // If direct fetch fails due to CORS, just set the URL as title
      try {
        const urlObj = new URL(url);
        setFormData(prev => ({
          ...prev,
          title: urlObj.hostname,
          imageUrl: '',
        }));
      } catch {
        // Invalid URL
      }
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.url.trim()) {
      alert('Please enter a URL');
      return;
    }

    // Use title if available, otherwise use URL as fallback
    let title = formData.title.trim();
    if (!title) {
      try {
        const urlObj = new URL(formData.url);
        title = urlObj.hostname;
      } catch {
        title = formData.url;
      }
    }

    try {
      const pinData = {
        url: formData.url,
        title: title,
        description: formData.description || undefined,
        imageUrl: formData.imageUrl || undefined,
        collectionId: formData.collectionId || undefined,
        tags: [],
      };

      if (editingPin) {
        // Update existing pin
        const updated = await api.updatePin(editingPin.id, pinData);
        setPins(pins.map(p => p.id === updated.id ? updated : p));
      } else {
        // Create new pin
        const created = await api.createPin(pinData);
        setPins([created, ...pins]);
      }
      handleCloseDialog();
    } catch (err) {
      console.error('Failed to save pin:', err);
      alert(err instanceof Error ? err.message : 'Failed to save pin');
    }
  };

  if (!isSignedIn) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your pins</CardDescription>
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
            <CardTitle>Error Loading Pins</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadPins}>Retry</Button>
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
            <h1 className="text-3xl font-bold text-foreground">Pins</h1>
            <p className="text-muted-foreground mt-2">
              {pins.length === 0 ? 'View and manage all your saved pins' : `${pins.length} saved ${pins.length === 1 ? 'pin' : 'pins'}`}
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            New Pin
          </Button>
        </div>

        {pins.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Pins Yet</CardTitle>
              <CardDescription>
                Start saving pins with the WiserPin browser extension or create one manually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                  <Pin className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-center mb-4">
                  Install the WiserPin browser extension to start saving and organizing your pins, or click "New Pin" to create one manually.
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  Your pins will appear here once you start saving them.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pins.map((pin) => (
              <Card key={pin.id} className="flex flex-col">
                {pin.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg border-b">
                    <img
                      src={pin.imageUrl}
                      alt={pin.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{pin.title}</CardTitle>
                  {pin.collection && (
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: pin.collection.color || '#6366f1' }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {pin.collection.name}
                      </span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  {pin.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {pin.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(pin.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDialog(pin)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(pin.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPin ? 'Edit Pin' : 'Create New Pin'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  required
                />
              </div>

              {/* Preview Card */}
              {fetchingMetadata ? (
                <div className="border border-border rounded-lg p-4 bg-muted">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading preview...</span>
                  </div>
                </div>
              ) : formData.url && formData.title ? (
                <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
                  <div className="flex gap-3 p-3">
                    {formData.imageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={formData.imageUrl}
                          alt={formData.title}
                          className="w-20 h-20 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="font-semibold text-sm text-foreground mb-1 line-clamp-2">
                        {formData.title || 'Untitled Page'}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {(() => {
                          try {
                            return new URL(formData.url).hostname;
                          } catch {
                            return formData.url;
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="description">Summary</Label>
                <Textarea
                  id="description"
                  placeholder="Write a summary about this pin..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection">Collection</Label>
                <Select
                  value={formData.collectionId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, collectionId: value === "none" ? '' : value })}
                >
                  <SelectTrigger id="collection">
                    <SelectValue placeholder="Select a collection (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No collection</SelectItem>
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPin ? 'Save Changes' : 'Create Pin'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
