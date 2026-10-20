import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { DataLoaders } from './loaders.factory.js';

export interface GraphQLContext {
  loaders: DataLoaders;
}

export const Loaders = createParamDecorator(
  (_data: unknown, context: ExecutionContext): DataLoaders =>
    GqlExecutionContext.create(context).getContext<GraphQLContext>().loaders,
);
