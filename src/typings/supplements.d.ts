declare interface MediaSession {
    setPositionState?(state: MediaPositionState): void;
}

declare interface MediaPositionState {
    duration?: number;
    playbackRate?: number;
    position?: number;
}

declare interface RemotePlayback extends EventTarget {
    watchAvailability(
        callback: RemotePlaybackAvailabilityCallback,
    ): Promise<number>;
    cancelWatchAvailability(id?: number): Promise<void>;
    readonly state: RemotePlaybackState;
    onconnecting: (event: Event) => any;
    onconnect: (event: Event) => any;
    ondisconnect: (event: Event) => any;
    prompt(): Promise<void>;
}

declare type RemotePlaybackState = 'connecting' | 'connected' | 'disconnected';

declare type RemotePlaybackAvailabilityCallback = (available: boolean) => void;

declare interface WebKitPlaybackTargetAvailabilityEvent extends Event {
    availability: string;
}

declare interface Window {
    WebKitPlaybackTargetAvailabilityEvent: WebKitPlaybackTargetAvailabilityEvent;
}

declare interface HTMLAudioElement {
    webkitCurrentPlaybackTargetIsWireless: boolean;
    webkitShowPlaybackTargetPicker(): void;
    remote: RemotePlayback;
    disableRemotePlayback: boolean;

    addEventListener(
        type: 'webkitplaybacktargetavailabilitychanged',
        listener: (
            this: HTMLAudioElement,
            ev: WebKitPlaybackTargetAvailabilityEvent,
        ) => any,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener(
        type: 'webkitplaybacktargetavailabilitychanged',
        listener: (
            this: HTMLAudioElement,
            ev: WebKitPlaybackTargetAvailabilityEvent,
        ) => any,
        options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions,
    ): void;
}
