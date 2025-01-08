export abstract class Storage<T> {
    abstract set(key: string, value: T): Promise<void>;

    abstract keys() ;

    abstract get(key: string): Promise<T>;

    abstract remove(key: string): Promise<void>;

    abstract purge(): Promise<void>;
}
export abstract class StorageProvider {
    abstract getStorage<T>(name: string): Storage<T>;
}
