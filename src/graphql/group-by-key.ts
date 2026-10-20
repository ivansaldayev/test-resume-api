export function groupByKey<K, V>(
  keys: readonly K[],
  items: readonly V[],
  keyOf: (item: V) => K,
): V[][] {
  const groups = new Map<K, V[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return keys.map((key) => groups.get(key) ?? []);
}
