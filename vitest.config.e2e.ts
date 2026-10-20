import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: [{ find: /^graphql$/, replacement: 'graphql/index.js' }] },
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['test/global-setup.ts'],
    setupFiles: ['test/setup-env.ts'],
    fileParallelism: false,
    env: { NODE_ENV: 'test', TZ: 'America/Los_Angeles' },
  },
});
