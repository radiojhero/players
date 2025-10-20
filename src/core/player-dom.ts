import addToQueryString from "../misc/add-to-query-string";
import { FADE_DURATION } from "../misc/gain";
import type Events from "./events";
import type { EventDetailMap } from "./events";
import MediaSessionWrapper from "./media-session";
import MetadataWatcher from "./metadata";
import type Player from "./player";

export default class HTMLPlayerElement {
  private static readonly _EMPTY_SOURCE = "about:blank";
  private static readonly _bypass = ["pause", "error"];
  private readonly _events: Events;
  private _sources: Source[];
  private _sourceIndex: number;
  private _metadataWatcher?: MetadataWatcher;
  private _continuousMetadata = true;
  private _mediaSession?: MediaSessionWrapper;
  private _domPlayer: HTMLAudioElement;
  private _player: Player;
  private _isPausing = false;

  constructor(sources: Source[], events: Events, player: Player) {
    this._domPlayer = new Audio();
    this._player = player;

    if ("mediaSession" in navigator) {
      this._mediaSession = new MediaSessionWrapper(this, events);
    }

    const isConnectionMetered =
      // @ts-expect-error: only supported on Chromium
      navigator.connection?.type === "cellular" ||
      navigator.userAgent.includes("iPhone");

    this._sources = sources.filter(
      (source) => this._domPlayer.canPlayType(source.type) !== "",
    );

    // This assumes the declared sources are ordered by increasing bitrate
    if (!isConnectionMetered) {
      this._sources.reverse();
    }

    this._sources.forEach((item) => {
      const source = document.createElement("source");
      source.type = item.type;
      source.src = item.src;
      this._domPlayer.appendChild(source);
    });

    this._events = events;
    this._domPlayer.volume = 1;

    const setSource = () => {
      if (!this._domPlayer.currentSrc) {
        requestAnimationFrame(setSource);
        return;
      }

      this._sourceIndex = this._sources.findIndex(
        (item) => this._domPlayer.currentSrc === item.src,
      );
      this._events.fire("sourcechange");
      this._domPlayer.src = HTMLPlayerElement._EMPTY_SOURCE;
      this._createMetadataWatcher();
    };
    setSource();

    this._domPlayer.preload = "none";
    this._domPlayer.crossOrigin = "anonymous";
    this._domPlayer.id = PLAYER_NAMESPACE;

    this._domPlayer.addEventListener("error", this._mapEvent("error"));
    this._domPlayer.addEventListener("loadstart", this._mapEvent("buffering"));
    this._domPlayer.addEventListener("pause", this._mapEvent("pause"));
    this._domPlayer.addEventListener("playing", this._mapEvent("play"));
    this._domPlayer.addEventListener("waiting", this._mapEvent("buffering"));

    events.on("play", () => {
      player.audioSource?.fadeIn();
    });
  }

  public play() {
    if (this._domPlayer.paused) {
      if (!this._continuousMetadata) {
        this._metadataWatcher?.watch();
      }

      this._domPlayer.src = this._sources[this._sourceIndex].src;
    }

    return this._domPlayer.play();
  }

  public pause() {
    if (this._domPlayer.paused || this._isPausing) {
      return;
    }

    if (!this._continuousMetadata) {
      this._metadataWatcher?.unwatch();
    }

    this._isPausing = true;
    this._player.audioSource?.fadeOut();
    this._events.fire("pause");

    if (this._domPlayer.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
      setTimeout(this._realPause, FADE_DURATION);
      return;
    }

    this._realPause();
  }

  public attach() {
    const audioContainer = document.querySelector(
      document.currentScript?.dataset.container ?? "body",
    ) as HTMLElement;
    audioContainer.appendChild(this._domPlayer);
    this._mediaSession?.attach();
  }

  public detach() {
    this._mediaSession?.detach();
    this._domPlayer.parentNode?.removeChild(this._domPlayer);
  }

  public fetchMetadata() {
    this._metadataWatcher?.fetchNow();
  }

  private _realPause = () => {
    this._domPlayer.src = HTMLPlayerElement._EMPTY_SOURCE;
    this._isPausing = false;
  };

  private _mapEvent(eventName: keyof EventDetailMap) {
    return (event: Event) => {
      if (
        !this._domPlayer.paused ||
        HTMLPlayerElement._bypass.indexOf(event.type) > -1
      ) {
        this._events.fire(eventName);
      }
    };
  }

  private _createMetadataWatcher() {
    const item = this._sources[this._sourceIndex];
    const offset =
      ((TIMESTAMPS_IN_SECONDS ? 1 : 1000) * (item.burst * 8)) / item.bitrate;

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

  public set currentSourceIndex(originalIndex) {
    const index = Math.floor(originalIndex);

    if (
      Number.isNaN(index) ||
      0 > index ||
      index >= this._sources.length ||
      this._sourceIndex === index
    ) {
      return;
    }

    this._sourceIndex = index;
    this._createMetadataWatcher();

    if (!this._domPlayer.paused) {
      this._domPlayer.src = this._sources[this._sourceIndex].src;
      void this.play();
    }

    this._events.fire("sourcechange");
  }

  public get allSources() {
    return this._sources.map((source) => source.title);
  }

  public get paused() {
    return this._domPlayer.paused;
  }

  public get volume() {
    return this._domPlayer.volume;
  }

  public set volume(level) {
    this._domPlayer.volume = level;
  }

  public get muted() {
    return this._domPlayer.muted;
  }

  public set muted(muted) {
    this._domPlayer.muted = muted;
  }

  public get domPlayer() {
    return this._domPlayer;
  }
}
