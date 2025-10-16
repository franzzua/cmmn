import {subtle} from "crypto";
import {Output} from "./vite.builder";

export async function getAssets(outputs: Output[]){
	return Promise.all(outputs.map(getAsset));
}

export async function getHash(data: string | Uint8Array) {
	const buffer = Buffer.from(data);
	const hash = await subtle.digest('SHA-1', buffer);
	return Buffer.from(hash).toString('base64');
}

async function getAsset(output: Output): Promise<Asset> {
	return {
		path: output.fileName,
		hash: await getHash(output.data),
		size: output.data.length,
	}
}