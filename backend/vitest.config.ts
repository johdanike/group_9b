import { defineConfig } from 'vitest/config';
import { nestTypescript } from './vitest-transform.js';

export default defineConfig({
  plugins: [nestTypescript()],
  test: {
    globals: true,
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./test/setup.ts'],
  },
});
