import "@cmmn/core";
import config from "@cmmn/tools/test/config";
import path from "path";

export default {
    ...config,
    roots: [path.join(process.cwd(), 'specs')],
};