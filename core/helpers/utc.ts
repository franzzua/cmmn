import { DateTime, Duration} from 'luxon';
export {DateTime, Duration};

export function utc(): DateTime;
export function utc(millis: number): DateTime;
export function utc(iso: string): DateTime;
export function utc(input?: string | number): DateTime {
    if (input === undefined) {
        return DateTime.utc();
    }
    if (typeof input === "string") {
        return DateTime.fromISO(input);
    }
    if (typeof input === "number") {
        return DateTime.fromMillis(input);
    }
    throw new Error("unsupported input for utc: " + input);
}
