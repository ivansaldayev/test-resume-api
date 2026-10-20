import { Field, ID, ObjectType } from '@nestjs/graphql';
import { YearMonth } from '../graphql/year-month.scalar.js';

@ObjectType()
export class Experience {
  @Field(() => ID)
  id: number;

  @Field()
  company: string;

  @Field()
  position: string;

  @Field(() => String, { nullable: true })
  location: string | null;

  @Field(() => YearMonth)
  startDate: Date;

  @Field(() => YearMonth, { nullable: true })
  endDate: Date | null;

  @Field(() => [String])
  achievements: string[];
}
