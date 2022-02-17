import {YjsWebrtcController,TokenParser} from "@cmmn/sync/webrtc/server";
import {controller, Get, Server} from "@cmmn/server";
import {Container, Injectable} from "@cmmn/core";
import fastify from "fastify";

@controller()
@Injectable()
export class Controller {

    constructor(private handler: YjsWebrtcController) {

    }

    @Get('', {webSocket: true})
    handleConnection(connection) {
        return this.handler.handleConnection(connection.socket);
    }
}

export class TokenParserMock extends TokenParser{
    public async Parse(token: string): Promise<{ User: string; AccessMode: "read" | "write" }> {
        return {
            AccessMode: "write",
            User: token
        };
    }

}

Server.withFastify(fastify)
    .with(Container.withProviders({
        provide: TokenParser, useClass: TokenParserMock
    }))
    .withControllers(Controller, TokenParserMock)
    .start(3005)
    .catch(console.error);