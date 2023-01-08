import {UserInfo} from "./signaling-connection";
import {EventEmitter} from "../shared/observable";
import {PeerConnection} from "./peer-connection";
import { SignalData } from "../shared/types";

export class DataChannelProvider {

    private static defaultOptions: RTCConfiguration = {
        iceServers: [{
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:global.stun.twilio.com:3478'
            ]
        }],
    }

    private Connections = new Map<string, RTCPeerConnection>();

    constructor(private options: RTCConfiguration) {
        globalThis.addEventListener('beforeunload', () => this.dispose());
    }

    private factory = user => (username) => {
        const connection = new RTCPeerConnection({
            ...DataChannelProvider.defaultOptions,
            ...this.options
        });
        connection.addEventListener('close', ()=> this.Connections.delete(username))
        this.listenIce(connection, user);
        return connection;
    }

    public async withOffer(user: UserInfo, signal: SignalData, onPeerConnection: (c: PeerConnection, room: string) => void) {
        if (signal.type !== 'offer')
            return;
        const peerConnection = this.Connections.getOrAdd(user.user, this.factory(user));
// Send any ice candidates to the other peer.
        console.log('get offer', signal.sdp);
        await peerConnection.setRemoteDescription(signal);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        console.log('send answer', answer.sdp);
        user.signaling.sendSignal({
            type: "signal",
            signal: answer,
            to: user.user
        });
        peerConnection.addEventListener('datachannel', e => {
            // if (e.signal.type !== 'datachannel') {
            //     return
            // }
            // const dataChannel = peerConnection.createDataChannel('chat', {
            //     ordered: true,
            //     id: 0
            // })
            // console.log('create channel', e.signal.id);
            onPeerConnection(new PeerConnection(e.channel, user), e.channel.label.split('-').pop());
        })
        return peerConnection;
        //
        // const event = await fromFirstEvent(peerConnection, 'datachannel') as RTCDataChannelEvent;
        // return event.channel;
    }


    public async initiate(user: UserInfo, room: string, currentUser) {
        const peerConnection = this.Connections.getOrAdd(user.user, this.factory(user));
        peerConnection.addEventListener('negotiationneeded', async e => {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            console.log('init offer', offer.sdp);
            user.signaling.sendSignal({
                type: "signal",
                signal: offer,
                to: user.user
            });
            const answer = await user.signaling.onceAsync('signal');
            if (!(answer.from.user == user.user && answer.signal.type == 'answer')) {
                throw new Error();
            }
            console.log('get answer', answer.signal.sdp);
            await peerConnection.setRemoteDescription(answer.signal);
            // return peerConnection;
        }, {
            once: true
        });

        // const id = Math.random();
// Send any ice candidates to the other peer.
        const dataChannel = peerConnection.createDataChannel(`${user.user}-${room}`);
        // await fromFirstEvent(peerConnection, 'negotiationneeded');
        // console.log('create channel', id);
        // user.signaling.sendSignal({
        //     type: 'signal',
        //     to: user.user,
        //     signal: {
        //         type: "datachannel",
        //         room: room,
        //         id: id,
        //
        //     }
        // })
        // if (peerConnection.)
        //     return dataChannel;
        await fromFirstEvent(dataChannel, 'open');
        return dataChannel;
    }

    private listenIce(peerConnection: RTCPeerConnection, user: UserInfo) {

        peerConnection.addEventListener('icecandidate', event => user.signaling.sendSignal({
            type: "signal",
            signal: {
                type: "candidate",
                candidate: event.candidate
            },
            to: user.user
        }));
        user.signaling.on('signal', event => {
            if (event.from.user == user.user && event.signal.type == 'candidate') {
                peerConnection.addIceCandidate(event.signal.candidate);
            }
        });
    }

    public async getConnection(user: UserInfo, room: string, currentUser: string): Promise<PeerConnection> {
        const dc = await this.initiate(user, room, currentUser);
        if (!dc)
            debugger;
        return new PeerConnection(dc, user);
    }

    public dispose() {
        for (let connection of this.Connections.values()) {
            connection.close();
        }
    }
}

export function fromFirstEvent(target: EventTarget, eventName: string, options?: EventListenerOptions): Promise<Event>;
// function fromFirstEvent<TEventTarget extends TypedEventTarget<TEventName, TEvent>,
//     TEventName extends string, TEvent extends Event>(target: TEventTarget, eventName: TEventName, options?: EventListenerOptions): Promise<TEvent>;
export function fromFirstEvent<TEvent extends keyof TEvents, TEvents>(target: EventEmitter<TEvents>, eventName: TEvent): Promise<TEvents[TEvent]>;
export function fromFirstEvent(target: EventTarget | EventEmitter<any>, eventName: string, options?: EventListenerOptions): Promise<any> {
    if ('addEventListener' in target) {
        return new Promise(resolve => target.addEventListener(eventName, resolve as any, {
            once: true,
            ...options
        }));
    } else if ('once' in target) {
        return new Promise(resolve => target.once(eventName, resolve as any));
    }
}

declare type UntypedEventTarget<TEventTarget extends EventTarget> = TEventTarget extends TypedEventTarget<infer TEventName, infer TEventType> ? TypedEventTarget<TEventName, TEventType> : EventTarget;

declare type TypedEventTarget<TEventName extends string, TEventType extends Event> = {
    addEventListener(eventName: TEventName, listener: (event: TEventType) => any, options?: EventListenerOptions);
}

