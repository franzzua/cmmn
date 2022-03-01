declare namespace Reflect {
    function metadata(metadataKey: any, metadataValue: any): {
        (target: Function): void;
        (target: Object, targetKey: string | symbol): void;
    };

    function getMetadata(metadataKey: any, target: Object): any;
}

(function () {

    const metadataMap = new Map<object, Map<string, any>>();

    Reflect.getMetadata = function (metadataKey: any, target: Object): any {
        return metadataMap.get(target)?.get(metadataKey);
    }

    Reflect.metadata = function metadata(metadataKey: any, metadataValue: any): {
        (target: Function): void;
        (target: Object, targetKey: string | symbol): void;
    } {
        return target => {
            metadataMap.getOrAdd(target, () => new Map()).set(metadataKey, metadataValue)
        };
    }
})();
