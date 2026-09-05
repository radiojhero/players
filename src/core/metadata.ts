import addToQueryString from "../misc/add-to-query-string";
import { ajaxGet } from "../misc/ajax";
import type Events from "./events";

interface ImageSize {
  src: string;
  sizes: string;
  type: string;
}

export interface Metadata {
  current_time: number;
  current_song_lyrics: any;
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
    album: string;
    artist: string;
    title: string;
    start_time: number;
    duration: number;
    cover?: ImageSize[];
  }[];
}

export default class MetadataWatcher {
  public get latestData() {
    return this._latestData;
  }

  private readonly _url: string;
  private readonly _offset: number;
  private readonly _events: Events;
  private _intervalId: number;
  private _isFetching: boolean;
  private _timeouts: number[] = [];
  private _latestData?: Metadata;
  private _eventSource?: EventSource;

  constructor(offset: number, events: Events) {
    this._url = addToQueryString(METADATA_URL, `offset=${offset.toString()}`);
    this._offset = offset;
    this._events = events;

    if ("EventSource" in window) {
      this._url = this._url.replace(/(?=\?|$)/, "/sse");
      this._setupSse();
    }
  }

  public watch() {
    if (this._eventSource || this._intervalId) {
      return;
    }

    this._intervalId = window.setInterval(() => {
      this.fetchNow();
    }, METADATA_INTERVAL);
    this.fetchNow();
  }

  public unwatch() {
    clearInterval(this._intervalId);
    this._intervalId = 0;
    this._timeouts.forEach(clearTimeout);
    this._timeouts = [];
    this._eventSource?.close();
  }

  public fetchNow() {
    if (
      this._eventSource ||
      this._isFetching ||
      !this._events.hasBindings("gotmetadata")
    ) {
      return;
    }

    this._isFetching = true;
    ajaxGet(
      this._url,
      (data) => {
        this._isFetching = false;

        if (!this._intervalId) {
          return;
        }

        if (!data) {
          this._events.fire("metadataerror");
          return;
        }

        this._latestData = JSON.parse(data) as Metadata;
        this._events.fire("gotmetadata", this._latestData);
      },
      false,
      true,
    );
  }

  private _handleMessage = (event: MessageEvent) => {
    if (!event.data) {
      return;
    }

    const currentTime = Number(event.lastEventId);
    const isNext = event.type === "next";

    const dispatch = (event: MessageEvent, offset = 0) => {
      const data = JSON.parse(event.data);
      let latestData = structuredClone(this._latestData ?? ({} as Metadata));
      this._latestData = latestData;
      latestData.current_time = currentTime + offset;

      switch (event.type) {
        case "reset": {
          latestData = data;
          this._latestData = data;
          break;
        }
        case "radioShow": {
          latestData.program = data;
          break;
        }
        case "song": {
          latestData.song_history.unshift(data);
          latestData.song_history.pop();
          break;
        }
        case "listeners": {
          latestData.listeners = data;
          break;
        }
        case "lyrics": {
          latestData.current_song_lyrics = data;
          break;
        }
      }

      if (offset > 0) {
        if (event.type === "song" && !isNext) {
          latestData.song_history[0].start_time += offset;
        }

        this._timeouts.shift();
      }

      this._events.fire("gotmetadata", latestData);
    };

    const delayDispatch = (event: MessageEvent, offset: number) => {
      const timeout = window.setTimeout(() => {
        dispatch(event, offset);
      }, offset);
      this._timeouts.push(timeout);
    };

    if (
      this._offset === 0 ||
      event.type === "listeners" ||
      event.type === "reset"
    ) {
      dispatch(event);
      return;
    }

    if (!isNext) {
      delayDispatch(event, this._offset);
      return;
    }

    const {
      next_lyrics = [],
      next_radio_shows = [],
      next_songs = [],
    } = JSON.parse(event.data);

    for (const { start_time, lyrics } of next_lyrics) {
      delayDispatch(
        { type: "lyrics", data: JSON.stringify(lyrics) } as MessageEvent,
        start_time - currentTime,
      );
    }

    for (const { timestamp, radio_show } of next_radio_shows) {
      delayDispatch(
        { type: "radioShow", data: JSON.stringify(radio_show) } as MessageEvent,
        timestamp - currentTime,
      );
    }

    for (const song of next_songs) {
      delayDispatch(
        { type: "song", data: JSON.stringify(song) } as MessageEvent,
        song.start_time - currentTime,
      );
    }
  };

  private _setupSse() {
    this._eventSource = new EventSource(this._url);
    this._eventSource.addEventListener("reset", this._handleMessage);
    this._eventSource.addEventListener("radioShow", this._handleMessage);
    this._eventSource.addEventListener("song", this._handleMessage);
    this._eventSource.addEventListener("listeners", this._handleMessage);
    this._eventSource.addEventListener("lyrics", this._handleMessage);
    this._eventSource.addEventListener("next", this._handleMessage);
  }
}
