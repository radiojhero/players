import addToQueryString from '../misc/add-to-query-string';
import Events, { EventDetailMap } from './events';
import MetadataWatcher from './metadata';
import MediaSessionWrapper from './media-session';

export default class HTMLPlayerElement {
    private static readonly _EMPTY_SOURCE = 'about:blank';
    private static readonly _bypass = ['pause', 'error', 'volumechange'];
    private readonly _events: Events;
    private _sources: Source[];
    private _sourceIndex: number;
    private _metadataWatcher?: MetadataWatcher;
    private _continuousMetadata = true;
    private _mediaSession?: MediaSessionWrapper;
    private _realPlayer: HTMLAudioElement;

    constructor(sources: Source[], events: Events) {
        this._realPlayer = new Audio();

        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        if ('mediaSession' in navigator) {
            this._mediaSession = new MediaSessionWrapper(this, events);
        }

        const isConnectionMetered =
            // @ts-expect-error: only supported on Chromium
            // eslint-disable-next-line n/no-unsupported-features/node-builtins, compat/compat, @typescript-eslint/no-unsafe-member-access
            navigator.connection?.type === 'cellular' ||
            // eslint-disable-next-line n/no-unsupported-features/node-builtins
            navigator.userAgent.includes('iPhone');

        this._sources = sources.filter(
            source => this._realPlayer.canPlayType(source.type) !== '',
        );

        // This assumes the declared sources are ordered by increasing bitrate
        if (!isConnectionMetered) {
            this._sources.reverse();
        }

        this._sources.forEach(item => {
            const source = document.createElement('source');
            source.type = item.type;
            source.src = item.src;
            this._realPlayer.appendChild(source);
        });

        this._events = events;
        this._realPlayer.volume = PLAYER_INITIAL_VOLUME;

        const setSource = () => {
            if (!this._realPlayer.currentSrc) {
                requestAnimationFrame(setSource);
                return;
            }

            this._sourceIndex = this._sources.findIndex(
                item => this._realPlayer.currentSrc === item.src,
            );
            this._realPlayer.src = HTMLPlayerElement._EMPTY_SOURCE;
            this._createMetadataWatcher();
        };
        setSource();

        this._realPlayer.preload = 'none';
        this._realPlayer.crossOrigin = 'anonymous';
        this._realPlayer.id = PLAYER_NAMESPACE;

        this._realPlayer.addEventListener('error', this._mapEvent('error'));
        this._realPlayer.addEventListener(
            'loadstart',
            this._mapEvent('buffering'),
        );
        this._realPlayer.addEventListener('pause', this._mapEvent('pause'));
        this._realPlayer.addEventListener('playing', this._mapEvent('play'));
        this._realPlayer.addEventListener(
            'volumechange',
            this._mapEvent('volumechange'),
        );
        this._realPlayer.addEventListener(
            'waiting',
            this._mapEvent('buffering'),
        );
    }

    public play() {
        if (this._realPlayer.paused) {
            if (!this._continuousMetadata) {
                this._metadataWatcher?.watch();
            }

            this._realPlayer.src = this._sources[this._sourceIndex].src;
        }

        return this._realPlayer.play();
    }

    public pause() {
        if (this._realPlayer.paused) {
            return;
        }

        if (this._realPlayer.readyState) {
            this._realPlayer.pause();
        } else {
            setTimeout(() => {
                this._events.fire('pause');
            });
        }

        if (!this._continuousMetadata) {
            this._metadataWatcher?.unwatch();
        }

        setTimeout(() => {
            this._realPlayer.src = HTMLPlayerElement._EMPTY_SOURCE;
        });
    }

    public attach() {
        document.body.appendChild(this._realPlayer);
        this._mediaSession?.attach();
    }

    public detach() {
        this._mediaSession?.detach();
        this._realPlayer.parentNode?.removeChild(this._realPlayer);
    }

    public fetchMetadata() {
        this._metadataWatcher?.fetchNow();
    }

    private _mapEvent(eventName: keyof EventDetailMap) {
        return (event: Event) => {
            if (
                !this._realPlayer.paused ||
                HTMLPlayerElement._bypass.indexOf(event.type) > -1
            ) {
                this._events.fire(eventName);
            }
        };
    }

    private _createMetadataWatcher() {
        const item = this._sources[this._sourceIndex];
        const offset = (item.burst * 8) / item.bitrate;

        this._metadataWatcher?.unwatch();
        this._metadataWatcher = new MetadataWatcher(
            addToQueryString(METADATA_URL, `offset=${offset.toString()}`),
            METADATA_INTERVAL,
            this._events,
        );

        if (this._continuousMetadata) {
            this._metadataWatcher.watch();
        }
    }

    public get metadataWatcher() {
        return this._metadataWatcher;
    }

    public get continuousMetadata() {
        return this._continuousMetadata;
    }

    public set continuousMetadata(continuousMetadata) {
        this._continuousMetadata = continuousMetadata;

        if (!this._metadataWatcher) {
            return;
        }

        if (!continuousMetadata) {
            this._metadataWatcher.unwatch();
            return;
        }

        this._metadataWatcher.watch();
    }

    public get currentSourceIndex() {
        return this._sourceIndex;
    }

    public set currentSourceIndex(index) {
        index = Math.floor(index);

        if (
            0 > index ||
            index >= this._sources.length ||
            this._sourceIndex === index
        ) {
            return;
        }

        this._sourceIndex = index;
        this._createMetadataWatcher();

        if (!this._realPlayer.paused) {
            this._realPlayer.src = this._sources[this._sourceIndex].src;
            void this.play();
        }
    }

    public get allSources() {
        return this._sources.map(source => source.title);
    }

    public get paused() {
        return this._realPlayer.paused;
    }

    public get volume() {
        return this._realPlayer.volume;
    }

    public set volume(level) {
        this._realPlayer.volume = level;
    }

    public get muted() {
        return this._realPlayer.muted;
    }

    public set muted(muted) {
        this._realPlayer.muted = muted;
    }

    public get domPlayer() {
        return this._realPlayer;
    }
}
