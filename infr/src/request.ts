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
                    .then(x => {
                        if (!x.ok) {
                            throw new RequestFailedError(this.url, this.request, x);
                        }
                        if (x.status == 204)
                            return undefined;
                        const type = x.headers.get('content-type');
                        if (!type)
                            throw new Error(`Response without content-type`)
                        if (type.match(/json/)) {
                            return x.json();
                        } else if (type.match(/text/)) {
                            return x.text();
                        }
                        return x.blob();
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

class RequestAbortedError extends Error {
    constructor(private reason: string) {
        super(["Request aborted by user", reason].filter(x => x).join(' '));
    }
}

class RequestFailedError extends Error {

    status = this.response.status;

    constructor(private url: string, private request: RequestInit, private response: Response) {
        super(`Request to ${url} failed with code ${response.status} (${response.statusText})`)
    }

}