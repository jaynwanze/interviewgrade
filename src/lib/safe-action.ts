import { z } from 'zod';

export const action = (
  schema: z.ZodSchema,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
