import addToQueryString from '../misc/add-to-query-string';
import Events, { EventDetailMap } from './events';
import MetadataWatcher from './metadata';
import MediaSessionWrapper from './media-session';

interface Source {
    type: string;
    bitrate: number;
    burst: number;
    src: string;
}

export default class HTMLPlayerElement extends Audio {
    private static readonly _EMPTY_SOURCE = 'about:blank';
    private static readonly _bypass = ['pause', 'error', 'volumechange'];
    private readonly _events: Events;
    private _realSource: string;
    private _metadataWatcher: MetadataWatcher;
    private _metadataSrc: string;
    private _continuousMetadata = true;
    private _mediaSession: MediaSessionWrapper;

    constructor(sources: Source[], events: Events) {
        super();

        if ('mediaSession' in navigator) {
            this._mediaSession = new MediaSessionWrapper(this, events);
        }

        sources.forEach(item => {
            const source = document.createElement('source');
            source.type = item.type;
            source.src = item.src;
            this.appendChild(source);
        });

        this._events = events;
        this.volume = PLAYER_INITIAL_VOLUME;

        const setSource = () => {
            if (!this.currentSrc) {
                requestAnimationFrame(setSource);
                return;
            }

            this._realSource = this.currentSrc;
            this.src = HTMLPlayerElement._EMPTY_SOURCE;

            let offset = 0;
            sources.forEach(item => {
                if (!offset && this._realSource === item.src) {
                    offset = item.burst / item.bitrate;
                }
            });

            this._metadataSrc = addToQueryString(METADATA_URL, { offset });
            this._metadataWatcher = new MetadataWatcher(
                this._metadataSrc,
                METADATA_INTERVAL,
                this._events,
            );

            if (this._continuousMetadata) {
                this._metadataWatcher.watch();
            }
        };
        setSource();

        this.preload = 'none';
        this.crossOrigin = 'anonymous';
        this.id = PLAYER_NAMESPACE;

        this.addEventListener('error', this._mapEvent('error'));
        this.addEventListener('loadstart', this._mapEvent('buffering'));
        this.addEventListener('pause', this._mapEvent('pause'));
        this.addEventListener('playing', this._mapEvent('play'));
        this.addEventListener('volumechange', this._mapEvent('volumechange'));
        this.addEventListener('waiting', this._mapEvent('buffering'));
    }

    /*
    public async play() {
        if (this.paused) {
            if (!this._continuousMetadata && this._metadataWatcher) {
                this._metadataWatcher.watch();
            }

            this.src = this._realSrc;
        }

        await super.play();
    }
    */

    public play() {
        if (this.paused) {
            if (!this._continuousMetadata && this._metadataWatcher) {
                this._metadataWatcher.watch();
            }

            this.src = this._realSource;
        }

        return super.play();
    }

    public pause() {
        if (this.paused) {
            return;
        }

        if (this.readyState) {
            super.pause();
        } else {
            setTimeout(() => {
                this._events.fire('pause');
            });
        }

        if (!this._continuousMetadata) {
            this._metadataWatcher.unwatch();
        }

        setTimeout(() => {
            this.src = HTMLPlayerElement._EMPTY_SOURCE;
        });
    }

    public attach() {
        document.body.appendChild(this);
        this._mediaSession?.attach();
    }

    public detach() {
        this._mediaSession?.detach();

        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    }

    public fetchMetadata() {
        this._metadataWatcher.fetchNow();
    }

    private _mapEvent(eventName: keyof EventDetailMap) {
        return (event: Event) => {
            if (
                !this.paused ||
                HTMLPlayerElement._bypass.indexOf(event.type) > -1
            ) {
                this._events.fire(eventName);
            }
        };
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
}
