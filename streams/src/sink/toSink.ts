import { Sink } from './sinkTo'

// export function toSink<T extends string | ArrayBufferLike | Blob | ArrayBufferView>(ws: WebSocket): Sink<T>
export function toSink<T>(sinkable: Sinkable<T>): Sink<T>{
  if ("set" in sinkable) return x => sinkable.set(x);
  if ("postMessage" in sinkable) return x => sinkable.postMessage(x);
  if ("dispatchEvent" in sinkable) return x => sinkable.dispatchEvent(x as any);
  if ("send" in sinkable) return x => sinkable.send(x as any);
  throw new Error(`${Object.getPrototypeOf(sinkable).name} is not supported`);
}

export type Sinkable<T> = {set(value: T): unknown;}
  | Pick<BroadcastChannel, "postMessage">
  | Pick<WebSocket, "send">
  | Pick<EventTarget, "dispatchEvent">
