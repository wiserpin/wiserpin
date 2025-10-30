import { useState } from 'react';
import type { CreateCollectionInput } from '@wiserpin/core';
import { addCollection } from '@wiserpin/storage';
import { Button, Input, Label } from '@wiserpin/ui';

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCollectionCreated: () => Promise<void>;
}

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
];

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onCollectionCreated,
}: CreateCollectionDialogProps) {
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

      // Reset form and close
      setName('');
      setGoal('');
      setColor(COLORS[0]?.value || '#3b82f6');
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to create collection:', err);
      setError(err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-lg w-[360px] mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Create Collection</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create a new collection to organize your pins
          </p>
        </div>

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
                    color === c.value ? 'border-gray-900 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Collection'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
