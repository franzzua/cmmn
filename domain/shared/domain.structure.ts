import "@cmmn/core";
import {ModelKey, ModelPath} from "./types";
import {ModelProxy} from "../entry/modelProxy";
import {ModelMap} from "../model-map";
import {Stream} from "../streams/stream";
import {getOrAdd} from "@cmmn/core";


type DefMapping = {
    type: 'array' | 'map' | 'link';
    model: Function;
    key: (x: any) => ModelKey | ModelKey[];
    id?: string;
}
type Def<TModel = any> = {
    instances: Map<string, ModelProxy<TModel, any>>;
    mappings: DefMapping[];
    root?: boolean;
    model: Function;
    target: {
        new(stream: Stream, path: ModelPath): ModelProxy<TModel, any>
    };
    getPath?: (key: ModelKey, self: ModelProxy<any, any>) => ModelPath;
};
export type StructureInfo = {
    type: 'array' | 'map' | 'link';
    to: Structure | string;
    key?: 'string';
}
export type Structure = {
    [key: string]: StructureInfo;
};
const definitions = new Map<Function, Def>();

// const defaultDef = () => ({mappings: [], root: false, instances: new Map()} as Def);

export function getRootProxy(): ConstructorOf<ModelProxy<any, any>> {
    for (let [key, definition] of definitions.entries()) {
        if (!definition.root)
            continue;
        return key as ConstructorOf<ModelProxy<any, any>>;
    }
    throw new Error("Root not found")
}

// function getStructure(def: Def, path: ModelPath): Structure | string {
//     if (!def)
//         debugger;
//     if (def.path) {
//         return def.path.slice(0, -1).join(':');
//     }
//     def.path = path;
//     const result = {};
//     for (const mapping of def.mappings) {
//         const targetStructure = getStructure(definitions.get(mapping.target()), [...path, mapping.id, '*']);
//         result[mapping.key ?? mapping.id] = {
//             type: mapping.type,
//             to: targetStructure,
//             key: mapping.id
//         };
//     }
//     return result;
// }

type ConstructorOf<T> = {
    new(...args: any[]): T;
};

function getDefinition(model: any): Def {
    let definition: Def | undefined = undefined;
    for (const def of definitions.values()) {
        if (def.model === model) {
            definition = def;
        }
    }
    if (!definition)
        throw new Error(`definition for model ${model} not found`);
    return definition;
}

export namespace proxy {
    export function clear(){
        for (let definition of definitions.values()) {
            definition.instances.clear();
        }
    }
    export const of = <TModel>(model: {
        new(...args: any[]): TModel;
    }, getPath?: (key: ModelKey, self: ModelProxy<any, any>) => ModelPath): ClassDecorator => {
        return (target: any) => {
            getOrAdd(definitions, target, () => ({
                mappings: [],
                root: !getPath,
                instances: new Map(),
                model, target, getPath
            } as Def));
        }
    }

    export const map = <TModel>(
        model: ConstructorOf<any>,
        getKeys: (model: TModel) => ModelKey[]
    ): PropertyDecorator => (target, propertyKey) => {
        Object.defineProperty(target, propertyKey, {
            get(this: ModelProxy<TModel, any>) {
                if (Object.hasOwn(this, propertyKey))
                    return this[propertyKey];
                const definition = getDefinition(model);
                Object.defineProperty(this, propertyKey, {
                    value: new ModelMap(this.stream,
                        () => getKeys(this.State),
                        id => {
                            const path = definition.getPath(id, this);
                            return getOrAdd(definition.instances, path.join(':'), () =>
                                this.locator.get(path, definition.target) as ModelProxy<any>);
                        })
                });
                return this[propertyKey];
            }
        });
    }
    // export const array = <TSource, TTarget>(model: ConstructorOf<TTarget>, key?: string): PropertyDecorator => (target, propertyKey) => {
    //     const def = definitions.getOrAdd(target.constructor, defaultDef)
    //     def.mappings.push({
    //         type: 'array',
    //         model,
    //         key: key,
    //         id: propertyKey as string
    //     });
    // }
    export const link = <TModel>(
        model: ConstructorOf<any>,
        getKey: (model: TModel) => ModelKey = () => 'Root'
    ): PropertyDecorator => (target, propertyKey) => {
        Object.defineProperty(target, propertyKey, {
            get(this: ModelProxy<TModel, any>) {
                const key = getKey(this.State);
                if (!key) return null;
                const definition = getDefinition(model);
                const path = definition.getPath(key, this);
                return getOrAdd(definition.instances, path.join(':'), () => this.locator['rootLocator'].get(path, definition.target) as ModelProxy<any>);
            }
        });
    }
}
