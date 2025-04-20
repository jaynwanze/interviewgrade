// src/components/ui/KeywordInput.tsx
'use client';

import * as React from 'react';
import type { ActionMeta, MultiValue } from 'react-select';
import { components } from 'react-select';
import CreatableSelect from 'react-select/creatable';

/* ---------------- helpers ---------------- */
type Opt = { label: string; value: string };
const toOpt = (s: string): Opt => ({ label: s, value: s });
const toStr = (o: Opt): string => o.value;

/* ---------------- public props ------------ */
interface KeywordInputProps {
  /** controlled value from parent */
  value: string[];
  /** push changes up */
  onChange: (v: string[]) => void;
  /** placeholder text */
  placeholder?: string;

  //d
  components?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MultiValue?: React.ComponentType<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DropdownIndicator?: React.ComponentType<any>;
  };
}

export const KeywordInput: React.FC<KeywordInputProps> = ({
  value,
  onChange,
  placeholder = 'Type something and press Enter…',
}) => {
  /* react‑select internal state */
  const [input, setInput] = React.useState('');

  /* keep Option[] in sync with parent string[] */
  const selected = React.useMemo(() => value.map(toOpt), [value]);

  /* convert library output -> string[] */
  const handleChange = (opts: MultiValue<Opt>, _meta: ActionMeta<Opt>) =>
    onChange(opts.map(toStr));

  /* custom “create on Enter / Tab / ,” logic */
  const handleKeyDown: React.KeyboardEventHandler = (e) => {
    if (!input) return;
    if (['Enter', 'Tab', ','].includes(e.key)) {
      /* avoid duplicates */
      if (!value.includes(input)) onChange([...value, input]);
      setInput(''); // clear the text box
      e.preventDefault(); // keep focus
    }
  };

  return (
    <CreatableSelect
      /* --- behaviour --- */
      isMulti
      isClearable
      menuIsOpen={false}
      components={{
        DropdownIndicator: null,
        ClearIndicator: components.ClearIndicator,
      }}
      inputValue={input}
      onInputChange={setInput}
      onKeyDown={handleKeyDown}
      value={selected}
      onChange={handleChange}
      placeholder={placeholder}
      /* --- minimal styling so chips wrap and match shadcn theme --- */
      styles={{
        valueContainer: (base) => ({
          ...base,
          flexWrap: 'wrap',
          gap: '0.25rem',
          padding: '6px 8px',
        }),
        control: (base, state) => ({
          ...base,
          minHeight: '2.5rem',
          borderRadius: '0.5rem',
          borderColor: state.isFocused
            ? 'hsl(var(--ring))'
            : 'hsl(var(--border))',
          backgroundColor: 'hsl(var(--background))',
        }),
        multiValue: (base) => ({
          ...base,
          backgroundColor: 'hsl(var(--secondary))',
        }),
        multiValueRemove: (base) => ({
          ...base,
          ':hover': {
            backgroundColor: 'hsl(var(--destructive))',
            color: '#fff',
          },
        }),
        placeholder: (base) => ({
          ...base,
          color: 'hsl(var(--muted-foreground))',
          fontSize: '0.875rem',
        }),
      }}
    />
  );
};
KeywordInput.displayName = 'KeywordInput';
