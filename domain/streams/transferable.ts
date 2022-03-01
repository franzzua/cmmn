import {Fn, registerSerializer} from "@cmmn/core";

/**
 * Список объектов, которые могут быть Transferable:
 *   https://developer.mozilla.org/en-US/docs/Glossary/Transferable_objects#supported_objects
 */
const transferableConstructors = new Set([
    globalThis.OffscreenCanvas,
    ImageBitmap, ArrayBuffer, ReadableStream, WritableStream,
    TransformStream, MessagePort, globalThis.AudioData, globalThis.VideoFrame
].filter(Fn.Ib));


function isTransferable(value): boolean {
    return value && typeof value === "object" && transferableConstructors.has(value.constructor);
}

export class Transferable {
    constructor(public index: number) {

    }

    public static Split<T>(data: T, results = []): any[] {
        if (!data || typeof data != "object")
            return results;
        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                if (!isTransferable(data[i])){
                    Transferable.Split(data[i], results);
                    continue;
                }
                results.push(data[i]);
                data[i] = new Transferable(results.length - 1);
            }
        }
        if (data instanceof Map) {
            for (let [key, value] of data) {
                if (!isTransferable(value)){
                    Transferable.Split(value, results);
                    continue;
                }
                results.push(value);
                data.set(key, new Transferable(results.length - 1));
            }
        }
        if (data instanceof Set) {
            for (let value of data) {
                if (!isTransferable(value)){
                    Transferable.Split(value, results);
                    continue;
                }
                results.push(value);
                data.delete(value);
                data.add(new Transferable(results.length - 1));
            }
        }
        for (let key in data){
            if (!isTransferable(data[key])) {
                Transferable.Split(data[key], results);
                continue;
            }
            results.push(data[key]);
            data[key] = new Transferable(results.length - 1) as any;
        }
        return results;
    }

    public static Join<T>(data: T, transferables: any[]):T {
        if (!data || typeof data != "object")
            return data;
        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                if (!(data[i] instanceof Transferable)){
                    Transferable.Join(data[i], transferables);
                    continue;
                }
                data[i] = transferables[data[i].index];
            }
        }
        if (data instanceof Map) {
            for (let [key, value] of data) {
                if (!(value instanceof Transferable)){
                    Transferable.Join(value, transferables);
                    continue;
                }
                data.set(key, transferables[value.index]);
            }
        }
        if (data instanceof Set) {
            for (let value of data) {
                if (!(value instanceof Transferable)){
                    Transferable.Join(value, transferables);
                    continue;
                }
                data.delete(value);
                data.add(transferables[value.index]);
            }
        }
        for (let key in data){
            if (data[key] instanceof Transferable) {
                const t = data[key] as any as Transferable;
                data[key] = transferables[t.index];
            } else {
                Transferable.Join(data[key], transferables);
            }
        }
        return data;
    }
}

/**
 * Чтобы исключить утечки памяти надо подготовить массив с передаваемыми Transferable-объектами (из тех,
 * что были указаны в аргументе message), на которые передаются права собственности.
 * Если право на объект передаётся, то он становится непригодным (neutered) в контексте-отправителе и становится
 * доступным только в контексте-получателе.
 */
export function replaceTransferable(data, results = []): any[] {

    walkThroughValues(data, (value) => {
        if (isTransferable(value))
            results.push(value);
    });
    return results;
}

/**
 * Обойти значения переданной структуры.
 * Значениями считаются:
 *   - значение поля объекта;
 *   - элемент массива.
 */
function walkThroughValues(data, callback: (value, key?: string) => void): void {
    if (isNotJustObject(data))
        return;
    else if (Array.isArray(data)) {
        for (const value of data) {
            callback(value);
            walkThroughValues(value, callback);
        }
        return;
    }
    for (const key in data) {
        const value = data[key];
        callback(value, key);
        walkThroughValues(value, callback);
    }
}

function isNotJustObject(value): boolean { // это не просто объект? Например, функция это тоже объект, но здесь она нас не интересует.
    return typeof value !== 'object' || value === null;
}

registerSerializer<Transferable, number>(10, Transferable,
    x => x.index,
    index => new Transferable(index)
    );
