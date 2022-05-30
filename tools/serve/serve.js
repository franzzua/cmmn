import {getConfigOptions} from "../bundle/getConfigs.js";
import servor from "servor";
import {relative, join} from "path";

export function serve(...options) {
    const configs = getConfigOptions({
        project: options.includes('-b'),
    });
    configs.filter(x => x.port).forEach(x => {
        const root = relative(process.cwd(), join(x.rootDir, 'dist'));
        console.log(`serve ${root} at localhost:${x.port}`);
        servor({
            root,
            fallback: 'index.html',
            reload: true,
            port: x.port
        })

    })

}
