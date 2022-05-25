import {Request} from "./request";

export class Api {

    public ApiUrl: string = '';

    public Headers: {
        Authorization?: string;
        ['Content-Type']?: string;
    } &{[key: string]: string} = {};

    request<T>(method, url, body: BodyInit, options: RequestInit): Request<T> {
        if (this.ApiUrl)
            url = this.ApiUrl + url;
        return new Request<T>(url, {
            method, body, ...options, headers: {
                ...options.headers,
                ...this.Headers
            }
        });
    }

    get<T>(url: string, options: RequestInit = {}): Request<T> {
        return this.request<T>('GET', url, null, options);
    }

    post<T>(url: string, body: any, options: RequestInit = {}): Request<T> {
        return this.request<T>('POST', url, JSON.stringify(body), options);
    }

    delete<T>(url: string, options: RequestInit = {}): Request<T> {
        return this.request<T>('DELETE', url, null, options);
    }

    put<T>(url: string, body: any, options: RequestInit = {}): Request<T> {
        return this.request<T>('PUT', url, JSON.stringify(body), options);
    }

}



