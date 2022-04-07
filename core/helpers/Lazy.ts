/**
 * Decorator for making getter one-time
 * After first call it redefine property with received value
 */
export function Lazy(target, prop, descr?): PropertyDescriptor {
    return {
        get() {
            const result = descr.get.call(this);
            Object.defineProperty(this, prop, {
                value: result
            })
            return result;
        },
        configurable: true
    }
}