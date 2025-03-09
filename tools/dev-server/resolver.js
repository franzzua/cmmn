export class Resolver {
    constructor(resolvers) {
        this.resolvers = resolvers;
    }

    resolveId = (id, importer, options) => {
        for (let resolver of this.resolvers) {
            const res = resolver.resolveId(id, importer, options);
            if (res) return res;
        }
    }
}