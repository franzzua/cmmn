import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {Readable} from "node:stream";
import zlib from "node:zlib";


const encoders = {
	zstd: () => zlib['createZstdCompress'],
	br: () => zlib.createBrotliCompress(),
	gzip: () => zlib.createGzip(),
	deflate: () => zlib.createDeflate(),
}

export function fastifyCompress(app: FastifyInstance, options: FastifyCompressOptions = {
	encodings: ['br', 'zstd', 'gzip', 'deflate']
}) {
	app.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply, payload: string | Uint8Array) => {
		for (const encoding of options.encodings) {
			if (!encoders[encoding] || !request.headers["accept-encoding"].includes(encoding)) continue;
			reply.header('content-encoding', encoding);
			return Readable.from(payload).pipe(encoders[encoding]() as any);
		}
	});
}

export type FastifyCompressOptions = {
	encodings: FastifyCompressEncoding[];
}

export type FastifyCompressEncoding = 'br' | 'zstd' | 'gzip' | 'deflate';