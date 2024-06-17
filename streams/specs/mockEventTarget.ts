

const listeners: Array<{this, event, listener}> = [];
export function mockEventTarget(){
    const originalAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (event, listener, options){
        originalAdd.call(this, event, listener, options);
        if (this instanceof AbortSignal) return;
        listeners.push({
            this: this, event, listener
        });
        console.info(`add event listener`, this);
    }
    const originalRemove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.removeEventListener = function (event, listener, options){
        originalRemove.call(this, event, listener, options);
        if (this instanceof AbortSignal) return;
        const existed = listeners.find(x => x.this === this &&
            x.listener === listener && x.event == event);
        if (!existed){
            console.error(`Remove event listener not found`, {event, this: this});
            return;
        }
        listeners.splice(listeners.indexOf(existed), 1);
        console.info(`remove event listener`, this);
    }
}

export function checkEventTargets(){
    if (listeners.length > 0){
        console.error(`Event listeners left, ${listeners.length}`, listeners.map(x => x.this));
    }
}