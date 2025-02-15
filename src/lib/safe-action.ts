import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const action = (
  schema: z.ZodSchema,
  handler: (data: any) => Promise<any>,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (input: any) => {
    const parsedInput = schema.safeParse(input);
    if (!parsedInput.success) {
      throw new Error('Validation failed');
    }
    return await handler(parsedInput.data);
  };
};
