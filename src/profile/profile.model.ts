import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Profile {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => String, { nullable: true })
  location: string | null;
}
