import {Target} from "../helpers/target.js";
import path from "node:path";

export async function dev(...flags) {
    const targets = await Target.readTargets(process.cwd(), flags);

}