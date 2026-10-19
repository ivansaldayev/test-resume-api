import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'nest start --entryFile seed',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
