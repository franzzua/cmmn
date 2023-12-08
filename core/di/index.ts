import {metadata} from "./reflect";

export * from './container.js';
export * from './decorators.js';
export * from './token.js';
export * from './types.js';
Object.assign(globalThis, {
    __metadata: metadata,
});