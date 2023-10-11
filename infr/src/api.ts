import {Request} from "./request.js";

export type RequestOptions = RequestInit & {
    params?: any;
}
export type Headers = {
    Authorization?: string;
    ['Content-Type']?: string;
} & { [key: string]: string };

export class Api {

    private ApiUrl: string = '';

    private static Headers : Headers = {};
    private Headers: Headers = {
        ['Content-Type']: 'application/json'
    };

    request<T>(method, url, body: any, options: RequestOptions): Request<T> {
        if (this.ApiUrl && !/^(http|ws)s?:/.test(url))
            url = this.ApiUrl + url;
        if (options.params) {
            url += `?` + Object.entries(options.params).map(([key, value]) => `${key}=${value}`).join('&');
        }
        const headers = {
            ...Api.Headers,
            ...this.Headers,
            ...options.headers,
        };
        if (body && headers["Content-Type"] === 'application/json')
            body = JSON.stringify(body)
        return new Request<T>(url, {
            method, body, ...options, headers
        });
    }

    get<T>(url: string, options: RequestOptions = {}): Request<T> {
        return this.request<T>('GET', url, null, options);
    }

    post<T>(url: string, body: any, options: RequestOptions = {}): Request<T> {
        return this.request<T>('POST', url, body, options);
    }

    delete<T>(url: string, options: RequestOptions = {}): Request<T> {
        return this.request<T>('DELETE', url, null, options);
    }

    put<T>(url: string, body: any, options: RequestOptions = {}): Request<T> {
        return this.request<T>('PUT', url, body, options);
    }

    with(options: { headers?: Headers, apiUrl?: string }) {
        const api = new Api();
        api.ApiUrl = options.apiUrl ?? this.ApiUrl;
        api.Headers = {
            ...this.Headers,
            ...options?.headers
        };
        return api;
    }

    addHeaders(headers: Headers){
        this.Headers = {
            ...this.Headers,
            ...headers
        };
    }
    setGlobalHeaders(headers: Headers){
        Api.Headers = {
            ...Api.Headers,
            ...headers
        };
    }
}



