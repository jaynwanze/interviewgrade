import { z } from "zod";

export const action = (schema: z.ZodSchema, handler: (data: any) => Promise<any>) => {
  return async (input: any) => {
    const parsedInput = schema.safeParse(input);
    if (!parsedInput.success) {
      throw new Error("Validation failed");
    }
    return await handler(parsedInput.data);
  };
};