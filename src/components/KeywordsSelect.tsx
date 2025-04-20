// ----------------- imports -----------------
import React from 'react';
import {
  components, // built‑ins you can reuse
  MultiValueProps,
  ValueContainerProps, // <-- export is here!
} from 'react-select';

export const createLimitedMultiValue =
  (maxVisible: number) =>
  <Option,>(props: MultiValueProps<Option, true>) => {
    const { index, getValue } = props;
    const values = getValue();
    if (index >= maxVisible) return null;
    if (index === maxVisible - 1 && values.length > maxVisible) {
      return (
        <div className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          +{values.length - maxVisible} more
        </div>
      );
    }
    return <components.MultiValue {...props} />;
  };
