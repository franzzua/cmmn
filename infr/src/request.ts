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
                    .then(x => x.json());
            } catch (e) {
                if (this.isAborted){
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

class RequestAbortedError extends Error{
    constructor(private reason: string) {
        super(["Request aborted by user", reason].filter(x => x).join(' '));
    }

}