# resume-api

A digital resume as a GraphQL API: profile, skills, work experience and projects.
You can explore it in Apollo Sandbox.

> **Status:** work in progress. The GraphQL API is not ready yet.

## Tech stack

- Node.js 24, TypeScript 6
- NestJS 12

Planned: GraphQL (Apollo Server 5, code-first), Prisma 7, PostgreSQL 18, Docker.

## How to run

You need Node.js 24.15 or newer (see `.nvmrc`).

```bash
nvm use
npm ci
npm run start:dev
```

The app runs on `http://localhost:3000`.
There are no routes yet, so every request returns 404.

## Configuration

The app reads settings from environment variables. It also reads a `.env` file
from the folder where you start the app, if the file exists (see
`.env.example`). Environment variables have priority over `.env`.

If a value is not valid, the app does not start and shows an error for each
variable.

| Variable   | Default       | Description                           |
| ---------- | ------------- | ------------------------------------- |
| `NODE_ENV` | `development` | `development`, `production` or `test` |
| `PORT`     | `3000`        | HTTP port                             |

## License

[MIT](LICENSE)
