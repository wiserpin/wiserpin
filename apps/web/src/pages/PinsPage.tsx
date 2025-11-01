import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsList, TabsTrigger, TabsContent, Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@wiserpin/ui';
import { Pin, ExternalLink, Trash2, Loader2, Plus, Edit, Sparkles, Search, Image } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '@clerk/clerk-react';
import { summarizerService } from '../lib/summarizer';

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
  description?: string;
  color?: string;
}

export function PinsPage() {
  const { isSignedIn, getToken } = useAuth();
  const [pins, setPins] = useState<PinData[]>([]);
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPins, setTotalPins] = useState(0);
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
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [suggestingCollection, setSuggestingCollection] = useState(false);
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
      loadCollections();
    }
  }, [isSignedIn, getToken]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (isSignedIn) {
      loadPins();
    }
  }, [isSignedIn, selectedCollection, debouncedSearchQuery, currentPage]);

  const loadPins = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getPins({
        collectionId: selectedCollection === 'all' ? undefined : selectedCollection,
        search: debouncedSearchQuery || undefined,
        page: currentPage,
        limit: 12,
      });
      setPins(result.data);
      setTotalPages(result.meta.totalPages);
      setTotalPins(result.meta.total);
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

  const handleGenerateSummary = async () => {
    if (!formData.url.trim()) {
      alert('Please enter a URL first');
      return;
    }

    setGeneratingSummary(true);
    try {
      const result = await summarizerService.summarizeUrl(formData.url);

      setFormData(prev => ({
        ...prev,
        description: result.summary,
      }));

      // Show user which AI was used
      const aiType = result.usedBrowserAI ? 'Browser AI (Gemini Nano)' : 'Cloud AI (Gemini)';
      console.log(`Summary generated using ${aiType}`);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleSuggestCollection = async () => {
    if (collections.length === 0) {
      alert('No collections available. Create a collection first.');
      return;
    }

    if (!formData.url.trim() || !formData.title.trim()) {
      alert('Please enter a URL first and wait for metadata to load');
      return;
    }

    setSuggestingCollection(true);
    try {
      const suggestedId = await summarizerService.suggestCollection({
        title: formData.title,
        url: formData.url,
        summary: formData.description,
        collections: collections,
      });

      if (suggestedId) {
        setFormData(prev => ({
          ...prev,
          collectionId: suggestedId,
        }));
        console.log('Collection suggested:', suggestedId);
      }
    } catch (error) {
      console.error('Failed to suggest collection:', error);
      alert(error instanceof Error ? error.message : 'Failed to suggest collection');
    } finally {
      setSuggestingCollection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.url.trim()) {
      alert('Please enter a URL');
      return;
    }

    if (!formData.collectionId) {
      alert('Please select a collection');
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
        collectionId: formData.collectionId,
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

  return (
    <>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pins</h1>
            <p className="text-muted-foreground mt-2">
              {totalPins === 0 ? 'View and manage all your saved pins' : `${totalPins} saved ${totalPins === 1 ? 'pin' : 'pins'}`}
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            New Pin
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search pins by title, description, or URL..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to page 1 on search
            }}
            className="pl-10"
          />
        </div>

        {/* Collection Tabs */}
        <Tabs value={selectedCollection} onValueChange={(value) => {
          setSelectedCollection(value);
          setCurrentPage(1); // Reset to page 1 on filter change
        }}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            {collections.map((collection) => (
              <TabsTrigger key={collection.id} value={collection.id} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: collection.color || '#6366f1' }}
                />
                {collection.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>Error Loading Pins</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={loadPins}>Retry</Button>
            </CardContent>
          </Card>
        ) : pins.length === 0 ? (
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
                <div className="aspect-video w-full overflow-hidden rounded-t-lg border-b">
                  {pin.imageUrl ? (
                    <img
                      src={pin.imageUrl}
                      alt={pin.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Image className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Summary</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateSummary}
                    disabled={generatingSummary || !formData.url}
                  >
                    {generatingSummary ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="description"
                  placeholder="Write a summary or generate one with AI..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="collection">Collection *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSuggestCollection}
                    disabled={suggestingCollection || !formData.url || !formData.title || collections.length === 0}
                  >
                    {suggestingCollection ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Auto-detect
                      </>
                    )}
                  </Button>
                </div>
                <Select
                  value={formData.collectionId}
                  onValueChange={(value) => setFormData({ ...formData, collectionId: value })}
                >
                  <SelectTrigger id="collection">
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent>
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
              <Button
                type="submit"
                disabled={!formData.url.trim() || !formData.collectionId}
              >
                {editingPin ? 'Save Changes' : 'Create Pin'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
