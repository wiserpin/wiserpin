/**
 * @wiserpin/ui
 *
 * Shared UI components built with shadcn/ui and Tailwind CSS
 */

// Import styles
import './styles/globals.css';

// Export utility functions
export { cn } from './lib/utils';

// Export components
export { Button, buttonVariants, type ButtonProps } from './components/button';
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './components/card';
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './components/dialog';
export { Input } from './components/input';
export { Label } from './components/label';
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './components/select';
export { Switch } from './components/switch';
export { Progress } from './components/progress';
export { Textarea } from './components/textarea';
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from './components/tabs';
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './components/pagination';
export {
  ChromeAIDownloadPage,
  type ChromeAIDownloadProps,
} from './components/chrome-ai-download';
