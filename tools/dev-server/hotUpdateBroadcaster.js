export class HotUpdateBroadcaster {
    #eventTarget = new EventTarget();

    enhanceDevServer(devServer) {
        const baseSend = devServer.ws.send
        this.#eventTarget.addEventListener('ws', e => baseSend(e.detail))
        devServer.ws.send = this.send;
    }

    send = payload => {
        return this.#eventTarget.dispatchEvent(new CustomEvent('ws', {detail: payload}));
    }
}