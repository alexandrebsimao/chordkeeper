import { Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Search input component with integrated icon.
 * 
 * @example
 * ```tsx
 * <SearchInput 
 *   value={searchTerm}
 *   onChange={setSearchTerm}
 *   placeholder="Buscar por título ou artista..."
 * />
 * ```
 */
export function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Buscar...",
  className = ""
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
