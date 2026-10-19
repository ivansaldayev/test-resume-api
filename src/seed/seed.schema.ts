import { z } from 'zod';
import { LinkType, SkillCategory } from '../generated/prisma/enums.js';

const text = z.string().trim().min(1);

// "2025-10" -> 2025-10-01 (UTC), so the date does not depend on the time zone.
const yearMonth = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
    error: 'Expected a month in YYYY-MM format',
    // Stop here, so the endDate >= startDate check does not run on a bad value.
    abort: true,
  })
  .transform((value) => new Date(`${value}-01T00:00:00.000Z`));

// The JSON uses lower case ("backend"), the database enum uses upper case.
function upperCaseEnum<T extends Record<string, string>>(values: T) {
  return z
    .string()
    .transform((value) => value.toUpperCase())
    .pipe(z.enum(values));
}

const experienceSchema = z
  .strictObject({
    company: text,
    position: text,
    startDate: yearMonth,
    endDate: yearMonth.nullable(),
    location: text.nullable(),
    achievements: z.array(text),
    skills: z.array(text),
  })
  .refine((item) => item.endDate === null || item.endDate >= item.startDate, {
    error: 'endDate must not be before startDate',
    path: ['endDate'],
  });

const projectSchema = z.strictObject({
  name: text,
  description: text.nullable(),
  url: z.httpUrl().nullable(),
  repositoryUrl: z.httpUrl().nullable(),
  skills: z.array(text),
});

export const seedSchema = z
  .strictObject({
    profile: z.strictObject({
      slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Expected a slug'),
      name: text,
      title: text,
      description: text,
      location: text.nullable(),
      links: z.array(
        z.strictObject({ type: upperCaseEnum(LinkType), url: z.url() }),
      ),
    }),
    skills: z.array(
      z.strictObject({ name: text, category: upperCaseEnum(SkillCategory) }),
    ),
    experience: z.array(experienceSchema),
    projects: z.array(projectSchema),
  })
  .superRefine((data, ctx) => {
    const skillNames = new Set<string>();
    data.skills.forEach((skill, index) => {
      if (skillNames.has(skill.name)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate skill "${skill.name}"`,
          path: ['skills', index, 'name'],
        });
      }
      skillNames.add(skill.name);
    });

    for (const key of ['experience', 'projects'] as const) {
      data[key].forEach((item, itemIndex) => {
        item.skills.forEach((name, skillIndex) => {
          if (!skillNames.has(name)) {
            ctx.addIssue({
              code: 'custom',
              message: `Unknown skill "${name}"`,
              path: [key, itemIndex, 'skills', skillIndex],
            });
          }
          if (item.skills.indexOf(name) !== skillIndex) {
            ctx.addIssue({
              code: 'custom',
              message: `Duplicate skill "${name}"`,
              path: [key, itemIndex, 'skills', skillIndex],
            });
          }
        });
      });
    }

    const projectNames = new Set<string>();
    data.projects.forEach((project, index) => {
      if (projectNames.has(project.name)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate project "${project.name}"`,
          path: ['projects', index, 'name'],
        });
      }
      projectNames.add(project.name);
    });
  });

export type SeedData = z.output<typeof seedSchema>;
