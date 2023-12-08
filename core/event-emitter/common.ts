export type EventListenerOptions = {
    Priority: number,
}
export const DefaultListenerOptions: EventListenerOptions = {
    Priority: 0
}

export type StoppableEvent<T> = T & {
    stop();
}
