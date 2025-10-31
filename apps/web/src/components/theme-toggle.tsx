import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'dark') {
      return <Moon className="h-5 w-5" />;
    }
    return <Sun className="h-5 w-5" />;
  };

  const getLabel = () => {
    if (theme === 'light') return 'Light';
    if (theme === 'dark') return 'Dark';
    return 'System';
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-between w-full px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      title={`Current theme: ${getLabel()}. Click to toggle.`}
    >
      <span className="flex items-center gap-3">
        {getIcon()}
        <span>Theme</span>
      </span>
      <span className="text-xs px-2 py-1 rounded-md bg-muted">{getLabel()}</span>
    </button>
  );
}
