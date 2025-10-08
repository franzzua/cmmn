import {DevServer} from "./dev-server";

export class Resolver {
    constructor(private devServer: DevServer) {
    }

    resolveId = (id, importer, options) => {
        for (const target of this.devServer.targetServers) {
            const res = target.resolveId(id, importer, options);
            if (res) return res;
        }
        return this.devServer.depServer.resolveId(id, importer, options);
    }
}