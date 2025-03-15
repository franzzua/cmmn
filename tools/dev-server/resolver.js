export class Resolver {
    /**
     * @param {DevServer} devServer
     */
    constructor(devServer) {
        this.devServer = devServer;
    }

    resolveId = (id, importer, options) => {
        for (const target of this.devServer.targetServers) {
            const res = target.resolveId(id, importer, options);
            if (res) return res;
        }
        return this.devServer.depServer.resolveId(id, importer, options);
    }
}