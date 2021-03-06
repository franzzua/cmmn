/**
 * Сравнивает на равенство два значения.
 * Поддерживается проверка объектов: встроенное сравнение объектов(метод 'equals'), array, Set, Map, любой object.
 *
 * Ограничения для: array, Set, Map.
 * Корректное сравнение можно ожидать:
 *   - если массивы были предварительно отсортированы;
 *   - если Set содержит только примитивы;
 *   - если ключи Map состоят только из примитивов.
 */
export function compare(a: any, b: any): boolean {
  if (typeof a !== "object" || a === null)
    return Object.is(a, b); // a{undefined | null | boolean | number | bigint | string | symbol | function} and b{any}
  if (typeof b !== "object" || b === null)
    return false;  // a{object} and b{undefined | null | boolean | number | bigint | string | symbol | function}

  // здесь и a и b это объекты
  if (a === b)
    return true;
  if (a.equals && b.equals)
    return a.equals(b);

  const aIsArr = Array.isArray(a);
  const bIsArr = Array.isArray(b);
  if (aIsArr && bIsArr)
    return compareArrays(a, b);
  else if (aIsArr || bIsArr)
    return false;

  const aIsSet = a instanceof Set;
  const bIsSet = b instanceof Set;
  if (aIsSet && bIsSet)
    return compareSets(a, b);
  else if (aIsSet || bIsSet)
    return false;

  const aIsMap = a instanceof Map;
  const bIsMap = b instanceof Map;
  if (aIsMap && bIsMap)
    return compareMaps(a, b);
  else if (aIsMap || bIsMap)
    return false;

  return compareObjects(a, b);
}


function compareArrays(a: any[], b: any[]): boolean {
  return a.length === b.length &&
      a.every((x, i) => compare(x, b[i]));
}

function compareSets(a: Set<any>, b: Set<any>): boolean {
  if (a.size !== b.size)
    return false;
  for (let x of a) {
    if (!b.has(x))
      return false;
  }
  return true;
}

function compareMaps(a: Map<any, any>, b: Map<any, any>): boolean {
  if (a.size !== b.size)
    return false;
  for (let key of a.keys()) {
    if (!b.has(key))
      return false;
    if (!compare(a.get(key), b.get(key)))
      return false;
  }
  return true;
}

function compareObjects(a: object, b: object): boolean {
  for (let key in a) {
    if (!(key in b))
      return false;
    if (!compare(a[key], b[key]))
      return false;
  }
  for (let key in b) {
    if (!(key in a))
      return false;
  }
  return true;
}
