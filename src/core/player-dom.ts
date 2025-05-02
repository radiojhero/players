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
  private _realPlayer: HTMLAudioElement;
  private _player: Player;
  private _isPausing = false;

  constructor(sources: Source[], events: Events, player: Player) {
    this._realPlayer = new Audio();
    this._player = player;

    if ("mediaSession" in navigator) {
      this._mediaSession = new MediaSessionWrapper(this, events);
    }

    const isConnectionMetered =
      // @ts-expect-error: only supported on Chromium
      navigator.connection?.type === "cellular" ||
      navigator.userAgent.includes("iPhone");

    this._sources = sources.filter(
      (source) => this._realPlayer.canPlayType(source.type) !== "",
    );

    // This assumes the declared sources are ordered by increasing bitrate
    if (!isConnectionMetered) {
      this._sources.reverse();
    }

    this._sources.forEach((item) => {
      const source = document.createElement("source");
      source.type = item.type;
      source.src = item.src;
      this._realPlayer.appendChild(source);
    });

    this._events = events;
    this._realPlayer.volume = 1;

    const setSource = () => {
      if (!this._realPlayer.currentSrc) {
        requestAnimationFrame(setSource);
        return;
      }

      this._sourceIndex = this._sources.findIndex(
        (item) => this._realPlayer.currentSrc === item.src,
      );
      this._realPlayer.src = HTMLPlayerElement._EMPTY_SOURCE;
      this._createMetadataWatcher();
    };
    setSource();

    this._realPlayer.preload = "none";
    this._realPlayer.crossOrigin = "anonymous";
    this._realPlayer.id = PLAYER_NAMESPACE;

    this._realPlayer.addEventListener("error", this._mapEvent("error"));
    this._realPlayer.addEventListener("loadstart", this._mapEvent("buffering"));
    this._realPlayer.addEventListener("pause", this._mapEvent("pause"));
    this._realPlayer.addEventListener("playing", this._mapEvent("play"));
    this._realPlayer.addEventListener("waiting", this._mapEvent("buffering"));

    events.on("play", () => {
      player.audioSource?.fadeIn();
    });
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
    if (this._realPlayer.paused || this._isPausing) {
      return;
    }

    if (!this._continuousMetadata) {
      this._metadataWatcher?.unwatch();
    }

    this._isPausing = true;
    this._player.audioSource?.fadeOut();
    this._events.fire("pause");

    if (this._realPlayer.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
      setTimeout(this._realPause, FADE_DURATION);
      return;
    }

    this._realPause();
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

  private _realPause = () => {
    this._realPlayer.src = HTMLPlayerElement._EMPTY_SOURCE;
    this._isPausing = false;
  };

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

    if (!this._realPlayer.paused) {
      this._realPlayer.src = this._sources[this._sourceIndex].src;
      void this.play();
    }

    this._events.fire("sourcechange");
  }

  public get allSources() {
    return this._sources.map((source) => source.title);
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
