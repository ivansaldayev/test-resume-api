import { spawnSync } from 'node:child_process';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

export default async function setup(project: TestProject) {
  const container = await startContainer();
  const databaseUrl = container.getConnectionUri();

  try {
    prepareDatabase(databaseUrl);
  } catch (error) {
    await container.stop();
    throw error;
  }

  project.provide('databaseUrl', databaseUrl);

  return async () => {
    await container.stop();
  };
}

async function startContainer() {
  try {
    return await new PostgreSqlContainer('postgres:18-alpine').start();
  } catch (error) {
    throw new Error('Cannot start the Postgres container. Is Docker running?', {
      cause: error,
    });
  }
}

function prepareDatabase(databaseUrl: string) {
  if (prisma(databaseUrl, ['migrate', 'deploy']) !== 0) {
    throw new Error('prisma migrate deploy failed');
  }

  const diff = prisma(databaseUrl, [
    'migrate',
    'diff',
    '--from-config-datasource',
    '--to-schema',
    'prisma/schema.prisma',
    '--exit-code',
  ]);
  if (diff === 2) {
    throw new Error(
      'prisma/schema.prisma does not match the migrations. ' +
        'Update the schema or create a migration: npx prisma migrate dev',
    );
  }
  if (diff !== 0) {
    throw new Error('prisma migrate diff failed');
  }
}

function prisma(databaseUrl: string, args: string[]): number | null {
  const result = spawnSync('npx', ['prisma', ...args], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
  if (result.error) {
    throw result.error;
  }
  return result.status;
}
