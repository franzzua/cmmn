import { Duration } from 'luxon';
import {DateTime} from 'luxon';

export function utc(d: (Date | number | string) = undefined): DateTime {
    if (typeof d === "string") {
        return DateTime.fromISO(d).toUTC();
    }
    if (typeof d === "number") {
        return DateTime.fromMillis(d, {zone: 'utc'});
    }
    if (d instanceof Date) {
        return DateTime.fromJSDate(d, {zone: 'utc'});
    }
    return DateTime.utc();
}


export function utcToday() {
    return utc().startOf('day');
}

export {DateTime, Duration}