import { ajaxGet } from '../misc/ajax';
import Events from './events';

interface ImageSize {
    src: string;
    sizes: string;
    type: string;
}

export interface Metadata {
    current_time: number;
    autodj: boolean;
    is_live: boolean;
    program: {
        name: string;
        djs: {
            name: string;
            avatar: ImageSize[];
        }[];
        cover: ImageSize[];
        genre: string;
        description: string;
    };
    listeners: {
        current: number;
        max: number;
        max_holder: string;
        max_time: number;
    };
    song_history: {
        artist: string;
        title: string;
        start_time: number;
        duration: number;
    }[];
}

export default class MetadataWatcher {
    public get latestData() {
        return this._latestData;
    }

    private readonly _url: string;
    private readonly _interval: number;
    private readonly _events: Events;
    private _intervalId: number;
    private _latestData: Metadata;

    constructor(url: string, interval: number, events: Events) {
        this._url = url;
        this._interval = interval;
        this._events = events;
    }

    public watch() {
        if (!this._intervalId) {
            this._intervalId = window.setInterval(() => {
                this.fetchNow();
            }, this._interval);
            this.fetchNow();
        }
    }

    public unwatch() {
        clearInterval(this._intervalId);
        this._intervalId = 0;
    }

    public fetchNow() {
        if (!this._events.hasBindings('gotmetadata')) {
            return;
        }

        ajaxGet(
            this._url,
            data => {
                if (!this._intervalId) {
                    return;
                }

                if (!data) {
                    this._events.fire('metadataerror');
                    return;
                }

                this._latestData = JSON.parse(data) as Metadata;
                this._events.fire('gotmetadata', this._latestData);
            },
            false,
            true,
        );
    }
}
