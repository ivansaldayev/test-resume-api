# resume-api

[![CI](https://github.com/ivansaldayev/test-resume-api/actions/workflows/ci.yml/badge.svg)](https://github.com/ivansaldayev/test-resume-api/actions/workflows/ci.yml)

A digital resume as a GraphQL API: profile, skills, work experience and projects.

**Live:** https://saldayev.ddns.net/graphql

Open the link in a browser. Apollo Sandbox opens with an example query.
Press **Run** to see the data.

## Tech stack

- Node.js 24, TypeScript 6
- NestJS 12, GraphQL (Apollo Server 5, code-first)
- Prisma 7, PostgreSQL 18
- DataLoader, zod
- Vitest, supertest, Testcontainers
- Docker, Docker Compose, GitHub Actions

## Example query

This is the query from the task:

```graphql
query {
  profile {
    name
    description
    skills {
      name
    }
    experience {
      company
      position
    }
    projects {
      name
    }
  }
}
```

The same query with `curl`:

```bash
curl https://saldayev.ddns.net/graphql \
  --header 'Content-Type: application/json' \
  --data '{"query":"{ profile { name description skills { name } experience { company position } projects { name } } }"}'
```

The `Content-Type: application/json` header is required. Without it, Apollo
Server blocks the request as a possible CSRF attack and returns 400.

## Run with Docker

You need Docker with Docker Compose. You do not need Node.js.

```bash
docker compose up --build
```

Then open http://localhost:3000/graphql.

What happens on start:

1. PostgreSQL starts. The app waits until the database is ready.
2. The app applies the migrations (`prisma migrate deploy`).
3. The app fills the database with the resume data. It does this only when the
   profile is not in the database yet.
4. The GraphQL server starts.

You do not need a `.env` file: Docker Compose has default values. The app and
the database ports are open only on `127.0.0.1`. Locally `/` returns 404: only
the live server redirects `/` to `/graphql`.

If port 3000 or 5432 is busy, choose other ports:

```bash
APP_PORT=3001 POSTGRES_PORT=5433 docker compose up --build
```

Then open http://localhost:3001/graphql. The app log still shows port 3000:
this is the port inside the container.

To stop the app and delete the data:

```bash
docker compose down --volumes
```

The next start fills the database again.

## Development

You need Node.js 24.15 or newer and Docker. `nvm install` reads the version
from `.nvmrc`.

```bash
nvm install
npm ci
cp .env.example .env
docker compose up --detach --wait db
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

`npx prisma db seed` builds the app into `dist` and runs the seed from there.
Do not run it while `npm run start:dev` is running.

In development the app writes the GraphQL schema to `schema.gql`. If you
change the API, commit this file too: CI checks that it is up to date.

| Script              | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `npm run start:dev` | Start the app and restart it after changes            |
| `npm run build`     | Build the app into `dist`                             |
| `npm run lint`      | Check the code style (Biome, Prisma schema, Prettier) |
| `npm run format`    | Fix the code style                                    |
| `npm run typecheck` | Check the types in the app and in the tests           |
| `npm run test:e2e`  | Run the e2e tests (Docker must be running)            |

## Configuration

The app reads settings from environment variables. It also reads a `.env` file
from the folder where you start the app, if the file exists (see
`.env.example`). Environment variables have priority over `.env`.

If a value is not valid, the app does not start and shows an error for each
wrong variable. The Docker image sets `NODE_ENV=production`.

| Variable       | Default       | Description                           |
| -------------- | ------------- | ------------------------------------- |
| `NODE_ENV`     | `development` | `development`, `production` or `test` |
| `PORT`         | `3000`        | HTTP port                             |
| `DATABASE_URL` | (required)    | PostgreSQL connection string          |

Docker Compose reads these variables from the shell or from `.env`:

| Variable            | Default  | Description               |
| ------------------- | -------- | ------------------------- |
| `POSTGRES_USER`     | `resume` | Database user             |
| `POSTGRES_PASSWORD` | `resume` | Database password         |
| `POSTGRES_DB`       | `resume` | Database name             |
| `POSTGRES_PORT`     | `5432`   | Database port on the host |
| `APP_PORT`          | `3000`   | App port on the host      |

Docker Compose puts the password into `DATABASE_URL` without changes.
Characters like `@`, `/`, `#` or `%` break the URL, so use only letters and
digits. To make such a password, run `openssl rand -hex 32`. The same is true
for `POSTGRES_USER` and `POSTGRES_DB`.

## API

```text
Query.profile
├── links
├── skills
├── experience
│   └── skills
└── projects
    └── skills
```

- The full schema is in [`schema.gql`](schema.gql). Sandbox shows it too.
- The API is read-only: there are no mutations.
- `profile` returns the first created profile.
- `startDate` and `endDate` use the `YearMonth` scalar, for example
  `"2025-10"`. `endDate: null` means that this is the current job.
- Experience is sorted by `startDate`, from newest to oldest. Profile skills
  are sorted by category, in the order of the `SkillCategory` enum in
  [`prisma/schema.prisma`](prisma/schema.prisma). Other lists, and skills
  inside one category, keep the order from the seed file.
- If there is no profile, the API returns an error with the code `NOT_FOUND`.

## Design decisions

**Layers.** The data modules are `profile`, `skills`, `experience` and
`projects`. Each one has a service and a repository. All except `skills` also
have a resolver: skills are only nested fields. Resolvers contain only GraphQL
code. Resolvers and loaders get data only through services. Only repositories
use Prisma. They return Prisma types, without extra models or mappers. Other
modules: `config`, `prisma` and `graphql` (shared code) and `seed` (the seed
script).

**DataLoader against N+1.** Every relation field uses `@ResolveField` and a
DataLoader. The app creates new loaders for each request in the GraphQL
context, so the cache does not live between requests. Request-scoped Nest
providers are not used: they would create all resolvers again for each
request. Prisma `include` is not used: the API loads a relation only when the
client asks for it.

The number of SQL queries does not depend on the amount of data. The query from
the task runs 4 SQL queries. The query with all relations, including nested
skills, runs 9. The test
[`test/n-plus-one.e2e-spec.ts`](test/n-plus-one.e2e-spec.ts) checks these
numbers with 1 and with 5 jobs and projects.

**Explicit many-to-many tables.** Jobs and projects have skills. The tables
`experience_skills` and `project_skills` store the order of the skills, so the
main skills go first. A Prisma implicit many-to-many table cannot store the
order.

**`YearMonth` scalar.** A job period has only a year and a month. `DateTime`
would return `2025-10-01T00:00:00.000Z`, and a client in a time zone behind UTC
would show September.

**Database start.** Migrations are in Git. The Docker entrypoint runs
`prisma migrate deploy`, then the seed, then the app. The seed reads
[`src/seed/profile.json`](src/seed/profile.json) and checks it with zod. It
writes all data in one transaction, so the database is either full or empty.
If the profile already exists, the seed does nothing, so a restart does not
change the data.

**Sandbox in production.** Introspection is on. The landing page opens Apollo
Sandbox with the query from the task.

## Tests and CI

The e2e tests use Vitest and supertest. The app runs in the test process, and
PostgreSQL runs in a container (Testcontainers). The tests check the query from
the task, nested data, sort order and the number of SQL queries.

GitHub Actions runs two jobs for each pull request. Both must pass before a
merge into `main`.

- `check`: lint, types, build, e2e tests, a check that `schema.gql` is up to
  date, and a check of both Compose files.
- `docker`: runs `docker compose up --build` from scratch on an ARM runner and
  sends a query. This checks that the project works after a clean start.

## Deployment

The live API runs on an ARM64 server. A GitHub release with a tag `vX.Y.Z`
starts the workflow [`release.yml`](.github/workflows/release.yml):

1. The `image` job builds a `linux/arm64` image on an ARM runner and pushes it
   to GHCR (`ghcr.io/ivansaldayev/test-resume-api`).
2. The `deploy` job waits for manual approval in the `production` environment.
   Then it connects to the server over SSH. The SSH key can run only one
   command: [`deploy/deploy.sh`](deploy/deploy.sh).
3. The script writes the new image tag to `.env`, runs `docker compose pull`
   and `docker compose up --wait`. It fails if the app does not become healthy.

The [`deploy`](deploy) folder has the server files:

- `compose.yaml`: the app image from GHCR and PostgreSQL. No ports are open on
  the host.
- `nginx.conf`: HTTPS, proxy to the app, redirect from `/` to `/graphql`.
- `deploy.sh`: the deploy script.

On the server, the same folder also has `.env` with `IMAGE_TAG` and
`POSTGRES_PASSWORD`.

To roll back, open the Release run of an older release and re-run its `deploy`
job. GitHub allows this only for 30 days after the run. A rollback does not
undo database migrations.

## License

[MIT](LICENSE)
