import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'server-only': new URL('./test/server-only-stub.ts', import.meta.url).pathname,
    },
  },
});
