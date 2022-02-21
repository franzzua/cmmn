import {TokenParser} from "@cmmn/sync";
import {controller, Get, Server} from "@cmmn/server";
import {Container, Injectable} from "@cmmn/core";
import fastify from "fastify";
import {WebSocketController} from "@cmmn/sync/websocket/server";

@controller()
export class Controller {
    private handler: WebSocketController = new WebSocketController(new TokenParserMock());

    constructor() {

    }

    @Get('', {webSocket: true})
    handleConnection(connection) {
        return this.handler.handleConnection(connection.socket);
    }
}

export class TokenParserMock extends TokenParser {
    public async Parse(token: string): Promise<{ User: string; AccessMode: "read" | "write" }> {
        return {
            AccessMode: "write",
            User: token
        };
    }

}

//@ts-ignore
Server.withFastify(fastify)
    .with(Container.withProviders({
        provide: TokenParser, useClass: TokenParserMock
    }))
    .withControllers(Controller, TokenParserMock)
    .start(3005)
    .catch(console.error);