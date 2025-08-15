export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = String(keyFn(item));
    (acc[key] ||= []).push(item);
    return acc;
  }, {});
}
