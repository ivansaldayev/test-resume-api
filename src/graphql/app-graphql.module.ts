import { join } from 'node:path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import type { Env } from '../config/env.schema.js';

export const AppGraphQLModule = GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>) => ({
    autoSchemaFile:
      config.get('NODE_ENV', { infer: true }) === 'production'
        ? true
        : join(process.cwd(), 'schema.gql'),
    sortSchema: true,
    buildSchemaOptions: { addNewlineAtEnd: true },
    graphiql: false,
    introspection: true,
    plugins: [
      ApolloServerPluginLandingPageLocalDefault({
        embed: { runTelemetry: false, endpointIsEditable: false },
      }),
    ],
  }),
});
