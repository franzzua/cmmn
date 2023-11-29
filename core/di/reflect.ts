import "../helpers/map";
const metadataMap = new Map<object, Map<string, any>>();

export function getMetadata(metadataKey: any, target: Object): any {
    return metadataMap.get(target)?.get(metadataKey);
}

export function metadata(metadataKey: any, metadataValue: any): {
    (target: Function): void;
    (target: Object, targetKey: string | symbol): void;
} {
    return target => {
        metadataMap.getOrAdd(target, () => new Map()).set(metadataKey, metadataValue)
    };
}
