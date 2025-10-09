import {OutputAsset, OutputChunk, RollupOutput} from "rollup";
import {subtle} from "crypto";
export async function getAssets(result: RollupOutput[]){
	return Promise.all(result.flatMap(x => x.output).map(
		output => getAsset(output)
	));
}

export async function getHash(data: string | Uint8Array) {
	const buffer = Buffer.from(data);
	const hash = await subtle.digest('SHA-1', buffer);
	return Buffer.from(hash).toString('base64');
}

async function getAsset(output: OutputChunk | OutputAsset): Promise<Asset> {
	const data = output.type == "asset" ? output.source : output.code;
	return {
		path: output.fileName,
		hash: await getHash(data),
		size: data.length,
	}
}
export type Asset = {
	path: string;
	hash: string;
	size: number;
}