import {type ProgressEvent} from "@cmmn/service-worker/client";

if(process.env.NODE_ENV === 'production'){
    await using animation = await runLoadingAnimation();
	// await import('@cmmn/service-worker/client');
}
export default await import("./app");


async function runLoadingAnimation(): Promise<AsyncDisposable>{
    const href = document.querySelector<HTMLLinkElement>('link[rel=icon]').href;
    const svg = await fetch(href).then(x => x.text());
    const wrapper = document.createElement('div');
    wrapper.innerHTML = svg;
    wrapper.style = 'position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; background: white; display: grid; place-items: center;';
    (wrapper.firstElementChild as SVGSVGElement).style = 'width: calc(min(50vh, 50vw)); height: calc(min(50vh, 50vw))';
    const progress = document.createElement('progress');
    progress.max = 100;
    progress.value = 0;
    wrapper.appendChild(progress);
    const animation = wrapper.animate([
        {opacity: 0},
        {opacity: 1}
    ], {
        duration: 300,
        fill: 'forwards'
    });
    const abort = new AbortController();
    globalThis.addEventListener('progress', (e: ProgressEvent) => {
        progress.value += e.progress * 100;
    }, abort);
    document.body.appendChild(wrapper);
    return {
        async [Symbol.asyncDispose](){
            wrapper.remove();
            abort.abort();
        }
    }
}