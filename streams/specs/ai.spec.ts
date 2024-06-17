import { it } from "node:test";

it('ai return', async () => {
    const gen = (async function *(){
        while(true){
            yield 1;
            await new Promise(r => setTimeout(r, 10));
        }
    })();
    setTimeout(() => {
        gen.return(void 0 as never);
    }, 100);
    await (async r => {
        for await (let _ of gen) {
            await Promise.resolve();
        }
    })();
})