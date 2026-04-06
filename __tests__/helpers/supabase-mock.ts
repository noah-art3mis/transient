/**
 * Creates a chainable mock that mimics the Supabase query builder.
 * Every method returns the chain (for chaining), and the chain is
 * awaitable (thenable), resolving to the configured result.
 */
export function createMockQueryBuilder(result: { data: any; error: any }) {
  const builder: Record<string, any> = {};

  const methods = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "gt", "gte", "lt", "lte",
    "is", "in", "not", "or",
    "textSearch", "order", "limit", "range",
    "single", "maybeSingle", "returns",
  ];

  for (const method of methods) {
    builder[method] = jest.fn(() => builder);
  }

  builder.then = (onfulfilled: (value: any) => any) =>
    Promise.resolve(result).then(onfulfilled);
  builder.catch = (onrejected: (reason: any) => any) =>
    Promise.resolve(result).catch(onrejected);

  return builder;
}
