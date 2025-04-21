'use client';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

/* ---------- public API ------------------------------------------------ */
export interface FilterSelectProps<T extends string = string> {
  /** visible label above the field (“Role”, “Industry” …) */
  label?: string;
  /** placeholder when nothing picked */
  placeholder: string;
  /** options list */
  options: readonly T[];
  /** controlled value */
  value: T;
  /** push the chosen option up */
  onChange: (v: T) => void;
  /** width classes (Tailwind) */
  className?: string;
}

/* ---------- component -------------------------------------------------- */
export const FilterSelect = <T extends string>({
  label,
  placeholder,
  options,
  value,
  onChange,
  className = 'w-full sm:w-[200px]',
}: FilterSelectProps<T>) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={`flex flex-col text-sm text-slate-500 ${className}`}>
      <label className="text-sm text-muted-foreground mb-1">{label}</label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span
              className={`truncate ${!value ? 'text-muted-foreground' : ''}`}
            >
              {value || placeholder}
            </span>{' '}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full min-w-[160px] max-w-[300px] p-0 z-40 mt-2">
          <Command>
            <CommandInput placeholder={`${!label ? placeholder : `Search ${label}…`}`} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading={label}>
                {options.map((opt) => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                  >
                    {opt}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
