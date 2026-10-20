import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';

const yearMonthFormat = /^\d{4}-(0[1-9]|1[0-2])$/;

function parseYearMonth(value: unknown): Date {
  if (typeof value !== 'string' || !yearMonthFormat.test(value)) {
    throw new GraphQLError('YearMonth must be a string in YYYY-MM format');
  }
  return new Date(`${value}-01T00:00:00.000Z`);
}

export const YearMonth = new GraphQLScalarType<Date, string>({
  name: 'YearMonth',
  description: 'Year and month in YYYY-MM format, for example "2025-10"',
  serialize(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new GraphQLError('YearMonth can only serialize Date values');
    }
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const year = String(value.getUTCFullYear()).padStart(4, '0');
    return `${year}-${month}`;
  },
  parseValue: parseYearMonth,
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('YearMonth must be a string in YYYY-MM format');
    }
    return parseYearMonth(ast.value);
  },
});
