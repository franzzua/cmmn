
/**
 * Возвращает время в UTC
 * @param d если undefined, то возвращает текущее время
 */
export function utc(d: (Date | number | string) = undefined): Date {
    return new Date(d);
}

export function utcToday() {
    const now = +utc();
    return utc(now - now % (1000*60*60*24));
}

