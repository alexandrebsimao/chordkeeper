import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MUSICAL_KEYS } from '@/config/constants';

interface KeySelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Selector component for musical keys using centralized MUSICAL_KEYS constant.
 * 
 * @example
 * ```tsx
 * <KeySelector 
 *   value={originalKey}
 *   onChange={setOriginalKey}
 *   label="Tom Original"
 *   placeholder="Selecione o tom"
 * />
 * ```
 */
export function KeySelector({ 
  value, 
  onChange, 
  label = "Tom",
  placeholder = "Selecione o tom",
  disabled = false,
  className = ""
}: KeySelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {MUSICAL_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
