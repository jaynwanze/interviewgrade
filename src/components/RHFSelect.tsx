// ui/RHFSelect.tsx
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { FilterSelect, FilterSelectProps } from './FilterSelect';

type RHFSelectProps<T extends string, F extends FieldValues> = Omit<
    FilterSelectProps<T>,
    'value' | 'onChange'
> & {
    control: Control<F>;
    name: Path<F>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RHFSelect<T extends string, F extends Record<string, any>>(
    props: RHFSelectProps<T, F>,
) {
    const { control, name, ...rest } = props;
    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <FilterSelect
                    {...rest}
                    value={field.value as T}
                    onChange={field.onChange}
                />
            )}
        />
    );
}
