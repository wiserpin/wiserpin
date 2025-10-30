import { describe, it, expect } from 'vitest';
import * as UIComponents from '../index';

describe('@wiserpin/ui components', () => {
  it('should export Button component', () => {
    expect(UIComponents.Button).toBeDefined();
    expect(typeof UIComponents.Button).toBe('object');
  });

  it('should export Card components', () => {
    expect(UIComponents.Card).toBeDefined();
    expect(UIComponents.CardHeader).toBeDefined();
    expect(UIComponents.CardTitle).toBeDefined();
    expect(UIComponents.CardDescription).toBeDefined();
    expect(UIComponents.CardContent).toBeDefined();
    expect(UIComponents.CardFooter).toBeDefined();
  });

  it('should export Dialog components', () => {
    expect(UIComponents.Dialog).toBeDefined();
    expect(UIComponents.DialogTrigger).toBeDefined();
    expect(UIComponents.DialogContent).toBeDefined();
    expect(UIComponents.DialogHeader).toBeDefined();
    expect(UIComponents.DialogFooter).toBeDefined();
    expect(UIComponents.DialogTitle).toBeDefined();
    expect(UIComponents.DialogDescription).toBeDefined();
  });

  it('should export Input component', () => {
    expect(UIComponents.Input).toBeDefined();
  });

  it('should export Label component', () => {
    expect(UIComponents.Label).toBeDefined();
  });

  it('should export Select components', () => {
    expect(UIComponents.Select).toBeDefined();
    expect(UIComponents.SelectTrigger).toBeDefined();
    expect(UIComponents.SelectContent).toBeDefined();
    expect(UIComponents.SelectItem).toBeDefined();
    expect(UIComponents.SelectValue).toBeDefined();
  });

  it('should export Switch component', () => {
    expect(UIComponents.Switch).toBeDefined();
  });

  it('should export utility functions', () => {
    expect(UIComponents.cn).toBeDefined();
    expect(typeof UIComponents.cn).toBe('function');
  });

  it('should merge classes with cn utility', () => {
    const result = UIComponents.cn('bg-red-500', 'bg-blue-500');
    // tw-merge should keep only the last bg color
    expect(result).toBe('bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const result = UIComponents.cn('base-class', false && 'hidden', 'visible');
    expect(result).toBe('base-class visible');
  });
});
