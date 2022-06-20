export type Log = {
    time?;
    duration?;
    message?;
    scope?;
    result?;
} & any;
export type logger = (data: Log) => void

export function useLogger(logger: logger) {
    LoggerState.logger = logger;
}

export const LoggerState: {
    logger: logger
} = {
    logger: console.log
}

export function log(info?: (self, args, result) => {}): MethodDecorator {
    return ((target, propertyKey, descriptor: any) => {
        return {
            async value(...args) {
                const start = performance.now();
                const result = await descriptor.value.apply(this, args);
                const duration = performance.now() - start;
                LoggerState.logger({
                    duration,
                    ...(info ? info(this, args, result) : {
                        message: this.constructor.name + '.' + String(propertyKey),
                        result,
                        args,
                    })
                })
                return result;
            }
        }
    }) as MethodDecorator;
}