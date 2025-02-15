import { Input } from './input';
import { useFormContext } from 'react-hook-form';

export const FileUpload = () => {
  const { register } = useFormContext(); // Access form context

  return (
    <Input
      type="file"
      accept="application/pdf, image/*" // Accept only PDF and image files
      {...register('fileUpload')} // Register the file input
    />
  );
};
