import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { LinkType } from '../generated/prisma/enums.js';

registerEnumType(LinkType, { name: 'LinkType' });

@ObjectType()
export class ProfileLink {
  @Field(() => LinkType)
  type: LinkType;

  @Field()
  url: string;
}
