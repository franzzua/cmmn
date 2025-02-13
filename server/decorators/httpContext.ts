import { FastifyReply, FastifyRequest } from 'fastify';

export class HttpContext {
	constructor(
		public request: FastifyRequest,
		public reply: FastifyReply,
	) {}
}
