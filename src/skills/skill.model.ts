import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { SkillCategory } from '../generated/prisma/enums.js';

registerEnumType(SkillCategory, { name: 'SkillCategory' });

@ObjectType()
export class Skill {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field(() => SkillCategory)
  category: SkillCategory;
}
