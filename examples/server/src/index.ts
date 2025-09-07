import { fastify } from "fastify";
import process from "node:process";
import "./ctrls/homeCtrl";
import "./ctrls/authCtrl";
import {registerRoutes} from "@cmmn/server";
import {di} from "@cmmn/core";

const app = fastify();

await registerRoutes(app as any, undefined, di);

app.listen({
	port: +(process.env.PORT ?? 9003),
	host: '0.0.0.0',
}, (err, address) => {
	if (err)
		console.error(err)
	else
		console.log(`LISTEN ${address}`);
})

process.on('beforeExit', () => {
	app.server.close()
	app.close();
	console.log(`STOP`)
})