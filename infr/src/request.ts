export class Request<T> {
    /** @internal **/
    public static fetch: (url: string, req: RequestInit) => Promise<Response>;

    private abort = new AbortController();
    private retryCount = 1;

    constructor(private url: string, private request: RequestInit) {
        request.signal = this.abort.signal;
    }

    async toPromise(): Promise<T> {
        while (true) {
            try {
                return await Request.fetch(this.url, this.request)
                    .then(async x => {
                        const body = await readBody(x);
                        if (!x.ok) {
                            throw new RequestFailedError(this.url, this.request, x, body);
                        }
                        return body;
                    });
            } catch (e) {
                if (this.isAborted) {
                    throw new RequestAbortedError(this.abortReason)
                }
                if (--this.retryCount <= 0) {
                    throw e;
                }
            }
        }
    }

    retry(count: number) {
        this.retryCount = count;
        return this;
    }

    isAborted = false;
    abortReason = null;

    cancel(reason = null) {
        this.isAborted = true;
        this.abortReason = reason;
        this.abort.abort();
    }
}

async function readBody(response: Response) {
    if (response.status == 204)
        return undefined;
    const length = +response.headers.get('content-length');
    if (length == 0){
        return null;
    }
    const type = response.headers.get('content-type');
    if (!type) {
        console.warn(`Response without content-type`, response);
        return undefined;
    }
    if (type.match(/json/)) {
        return response.json();
    } else if (type.match(/text/)) {
        return response.text();
    } else if (type.match(/(image)/)) {
        return response.blob();
    } else if (type.match(/(protobuf)/)) {
        return response.arrayBuffer();
    }
    try {
        return response.json();
    } catch (e) {
        return response.text();
    }
}

export class RequestAbortedError extends Error {
    constructor(private reason: string) {
        super(["Request aborted by user", reason].filter(x => x).join(' '));
    }
}

export class RequestFailedError extends Error {

    status = this.response.status;


    constructor(private url: string, private request: RequestInit, private response: Response, private result: any) {
        super(`Request to ${url} failed with code ${response.status} (${response.statusText})`)
    }

}