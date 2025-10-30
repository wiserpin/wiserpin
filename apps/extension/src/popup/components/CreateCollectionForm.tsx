import { useState } from 'react';
import type { CreateCollectionInput } from '@wiserpin/core';
import { addCollection } from '@wiserpin/storage';
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@wiserpin/ui';

interface CreateCollectionFormProps {
  onCollectionCreated: () => Promise<void>;
  onCancel: () => void;
}

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
];

export function CreateCollectionForm({
  onCollectionCreated,
  onCancel,
}: CreateCollectionFormProps) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [color, setColor] = useState(COLORS[0]?.value || '#3b82f6');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!name.trim()) {
        setError('Collection name is required');
        return;
      }
      if (!goal.trim()) {
        setError('Collection goal is required');
        return;
      }

      const input: CreateCollectionInput = {
        name: name.trim(),
        goal: goal.trim(),
        color,
      };

      await addCollection(input);
      await onCollectionCreated();

      // Reset form
      setName('');
      setGoal('');
      setColor(COLORS[0]?.value || '#3b82f6');
    } catch (err) {
      console.error('Failed to create collection:', err);
      setError(err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Collection</CardTitle>
        <CardDescription>
          Create a new collection to organize your pins
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collection-name">Name</Label>
            <Input
              id="collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Research Articles"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection-goal">Goal</Label>
            <Input
              id="collection-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What are you collecting these for?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c.value ? 'border-gray-900 dark:border-gray-100 scale-110' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Collection'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
