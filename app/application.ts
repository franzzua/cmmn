import {Container} from "@cmmn/core";
import {Router} from "./router";

export class Application {

    constructor(private container: Container) {
        window.addEventListener('beforeunload', () => this.destroy())
    }

    public destroy() {
        this.container.get<Router>(Router).destroy();
    }
}