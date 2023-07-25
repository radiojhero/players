import { parse, ParsedUrlQuery } from 'querystring';
import AudioSource from '../misc/audio-source';
import ready from '../misc/ready';
import canChangeVolume from '../misc/volume';
import Clock from './clock';
import Events, {
    EventHandlers,
    EventCallbacks,
    EventDetailMap,
} from './events';
import HTMLPlayerElement from './player-dom';
import Tracker from './tracker';
import Caster from './caster';
import CasterFactory from './caster/factory';

interface ChildPlayer {
    element: Element;
    parameters: Record<string, any>;
    playerType: string;
    iframe: HTMLIFrameElement;
}

export default class Player {
    public get playing() {
        return !this._audio.paused;
    }

    public get volume() {
        return canChangeVolume() ? this._audio.volume : -1;
    }

    public set volume(level) {
        if (!canChangeVolume() || this._audio.volume === level) {
            return;
        }

        this._audio.volume = level;
        this._events.fire('volumechange');
    }

    public get muted() {
        return this._audio.muted;
    }

    public set muted(muted) {
        if (this._audio.muted === muted) {
            return;
        }

        this._audio.muted = muted;
        this._events.fire('volumechange');
    }

    public get metadata() {
        return this._audio.metadataWatcher.latestData;
    }

    public get continuousMetadata() {
        return this._audio.continuousMetadata;
    }

    public set continuousMetadata(continuousMetadata) {
        this._audio.continuousMetadata = continuousMetadata;
    }

    public get audioSource() {
        return this._audioSource;
    }

    public get castStatus() {
        return this._caster?.status ?? { type: 'none', available: false };
    }

    public get allSources() {
        return this._sources.map(source => source.title);
    }

    public get currentSourceIndex() {
        return this._audio.currentSourceIndex;
    }

    public set currentSourceIndex(index) {
        this._audio.currentSourceIndex = index;
    }

    private _audio: HTMLPlayerElement;
    private _audioSource: AudioSource;
    private _events: Events;
    private _loaded: boolean;
    private _clock: Clock;
    private _tracker: Tracker;
    private _childPlayers: NodeListOf<HTMLIFrameElement>;
    private _caster?: Caster;
    private _sources: Source[];

    constructor() {
        const existingPlayer = window[PLAYER_NAMESPACE];
        const addToExistingPlayer =
            existingPlayer?._addChildPlayer !== undefined;

        if (!addToExistingPlayer) {
            this._load();
            window[PLAYER_NAMESPACE] = this;
            document.dispatchEvent(new CustomEvent(`${PLAYER_NAMESPACE}init`));
        }

        ready(() => {
            const id = `${PLAYER_NAMESPACE}-container`;
            const elements = document.querySelectorAll<HTMLElement>(`.${id}`);

            Array.from(elements).forEach(element => {
                element.classList.remove(id);
                element.classList.add(`${id}-processed`);

                if (getComputedStyle(element).position === 'static') {
                    element.style.position = 'relative';
                }

                element.style.overflow = 'hidden';

                const playerType = element.dataset.type;
                const iframe = document.createElement('iframe');

                if (!playerType || /[^\da-z]/i.test(playerType)) {
                    throw new Error(
                        'The attribute `data-type` is missing or invalid.',
                    );
                }

                iframe.style.border = 'none';
                iframe.style.position = 'absolute';
                iframe.style.left = '0';
                iframe.style.top = '0';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.overflow = 'hidden';
                iframe.className = `${PLAYER_NAMESPACE}-view`;

                iframe.src = 'about:blank';

                const dataParameters = element.dataset.params;
                let parameters: ParsedUrlQuery = {};
                if (dataParameters) {
                    parameters = parse(dataParameters);
                }

                if (addToExistingPlayer) {
                    existingPlayer._addChildPlayer({
                        element: element,
                        parameters: parameters,
                        playerType,
                        iframe,
                    });
                    return;
                }

                this._addChildPlayer({
                    element,
                    parameters,
                    playerType,
                    iframe,
                });
            });
        });
    }

    public _addChildPlayer(childPlayer: ChildPlayer) {
        childPlayer.element.appendChild(childPlayer.iframe);

        const iframeWindow = childPlayer.iframe.contentWindow;
        const iframeDocument = childPlayer.iframe.contentDocument;

        if (!iframeWindow || !iframeDocument) {
            childPlayer.element.removeChild(childPlayer.iframe);
            return;
        }

        iframeWindow[PLAYER_NAMESPACE] = this;
        iframeWindow.params = childPlayer.parameters;
        iframeDocument.write(
            `<script async src="${PLAYER_DOMAIN}/players/${childPlayer.playerType}.js"></script>`,
        );
        iframeDocument.close();
        iframeDocument.body.style.overflow = 'hidden';
    }

    public play() {
        if (!this._loaded) {
            throw new Error('Player not loaded yet.');
        }

        if (this._audioSource) {
            void this._audioSource.context.resume();
        }

        return this._audio.play();
    }

    public pause() {
        this._audio.pause();
    }

    public toggle(toggle?: boolean) {
        toggle = toggle === undefined ? !this.playing : toggle;
        void this[toggle ? 'play' : 'pause']();
    }

    public fetchMetadata() {
        this._audio.fetchMetadata();
    }

    public showCastPicker() {
        this._caster?.showCastPicker();
    }

    public on(events: EventCallbacks): void;
    public on<T extends keyof EventDetailMap>(
        types: T,
        callbacks: EventHandlers<EventDetailMap[T]>,
    ): void;
    public on(types: string, callbacks: EventHandlers): void;
    public on(
        eventsOrTypes: EventCallbacks | string,
        callbacks?: EventHandlers,
    ) {
        this._events.on(eventsOrTypes, callbacks);
    }

    public off(events: EventCallbacks): void;
    public off<T extends keyof EventDetailMap>(
        types: T,
        callbacks?: EventHandlers<EventDetailMap[T]>,
    ): void;
    public off(types: string, callbacks?: EventHandlers): void;
    public off(
        eventsOrTypes: EventCallbacks | string,
        callbacks?: EventHandlers,
    ) {
        this._events.off(eventsOrTypes, callbacks);
    }

    private _load() {
        this._loaded = true;
        this._sources = SOURCES;
        this._events = new Events();
        this._audio = new HTMLPlayerElement(this._sources, this._events);
        this._clock = new Clock(this, this._events);
        this._tracker = new Tracker(this);
        this._childPlayers = document.querySelectorAll(
            `iframe.${PLAYER_NAMESPACE}-view`,
        );
        this._caster = CasterFactory.create(this._audio, this._events);

        this._audio.attach();

        try {
            this._audioSource = new AudioSource(this._audio);
        } catch {
            // Do nothing if Web Audio API is unsupported
        }
    }
}
