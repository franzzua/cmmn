export type Provider = {
    provide: any;
    useClass?: any;
    useValue?: any;
    useFactory?: any;
    deps?: any[];
    multiple?: boolean;
};

export type ProviderOrValue = Provider | {
    new(...args): any;
};