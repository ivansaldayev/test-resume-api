import { join } from 'node:path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import type { Env } from '../config/env.schema.js';
import { exampleQuery } from './example-query.js';
import type { GraphQLContext } from './loaders.decorator.js';
import { LoadersFactory } from './loaders.factory.js';
import { LoadersModule } from './loaders.module.js';

export const AppGraphQLModule = GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  imports: [LoadersModule],
  inject: [ConfigService, LoadersFactory],
  useFactory: (
    config: ConfigService<Env, true>,
    loadersFactory: LoadersFactory,
  ) => ({
    autoSchemaFile:
      config.get('NODE_ENV', { infer: true }) === 'production'
        ? true
        : join(process.cwd(), 'schema.gql'),
    sortSchema: true,
    buildSchemaOptions: { addNewlineAtEnd: true },
    graphiql: false,
    introspection: true,
    fieldResolverEnhancers: ['filters'],
    plugins: [
      ApolloServerPluginLandingPageLocalDefault({
        embed: { runTelemetry: false, endpointIsEditable: false },
        document: exampleQuery,
      }),
    ],
    context: (): GraphQLContext => ({ loaders: loadersFactory.create() }),
  }),
});
