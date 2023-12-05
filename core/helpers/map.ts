export function getOrAdd<TKey, TValue>(map: Map<TKey, TValue>, key: TKey, factory: (key: TKey) => TValue): TValue {
    const existed = map.get(key);
    if (existed) return existed;
    const newItem = factory(key);
    map.set(key, newItem);
    return newItem;
}
