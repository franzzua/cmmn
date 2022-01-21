import {Temporal} from "@js-temporal/polyfill";
import ZonedDateTime = Temporal.ZonedDateTime;
import Duration = Temporal.Duration;

export function utc(): Instant;
export function utc(millis: number): Instant;
export function utc(iso: string): Instant;
export function utc(input?: string | number): Instant {
    if (input === undefined) {
        return Instant.now();
    }
    if (input === null)
        return  null;
    if (typeof input === "string") {
        return Instant.fromISO(input);
    }
    if (typeof input === "number") {
        return new Instant(BigInt(input) * BigInt(1E6));
    }
    throw new Error("unsupported input for utc: " + input);
}


export function local(): ZonedDateTime;
export function local(millis: number): ZonedDateTime;
export function local(iso: string): ZonedDateTime;
export function local(input?: string | number): ZonedDateTime {
    return utc(input as any).toZonedDateTimeISO(Temporal.Now.timeZone());
}

export class Instant extends Temporal.Instant {
    public toLocal() {
        return this.toZonedDateTimeISO(Temporal.Now.timeZone());
    }

    public static now() {
        return this.extend(Temporal.Now.instant());
    }

    public static fromISO(iso: string) {
        return this.extend(Temporal.Instant.from(iso));
    }

    private static extend(inst: Temporal.Instant): Instant {
        // @ts-ignore
        inst.__proto__ = Instant.prototype;
        return inst as Instant;
    }
}

export {
    Instant as DateTime,
    Duration
};
