import AudioSource from "../misc/audio-source";
import parseParameters from "../misc/parse-parameters";
import ready from "../misc/ready";
import type Caster from "./caster";
import createCaster from "./caster/factory";
import Clock from "./clock";
import Events, {
  type EventHandlers,
  type EventCallbacks,
  type EventDetailMap,
} from "./events";
import HTMLPlayerElement from "./player-dom";
import Tracker from "./tracker";

interface ChildPlayer {
  element: Element;
  parameters: string;
  playerType: string;
  iframe: HTMLIFrameElement;
}

export default class Player {
  public get playing() {
    return !this._audio.paused;
  }

  public get volume() {
    const object = this._audioSource ?? this._audio;
    return object.volume;
  }

  public set volume(level) {
    const object = this._audioSource ?? this._audio;

    if (object.volume === level) {
      return;
    }

    object.volume = level;
    this._events.fire("volumechange");
  }

  public get muted() {
    return this._audio.muted;
  }

  public set muted(muted) {
    if (this._audio.muted === muted) {
      return;
    }

    this._audio.muted = muted;
    this._events.fire("volumechange");
  }

  public get metadata() {
    return this._audio.metadataWatcher?.latestData;
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
    return this._caster?.status ?? { type: "none", available: false };
  }

  public get allSources() {
    return this._audio.allSources;
  }

  public get currentSourceIndex() {
    return this._audio.currentSourceIndex;
  }

  public set currentSourceIndex(index) {
    this._audio.currentSourceIndex = index;
  }

  private _audio: HTMLPlayerElement;
  private _audioSource?: AudioSource;
  private _events: Events;
  private _loaded: boolean;
  // @ts-expect-error: really unused...
  private _clock: Clock;
  // @ts-expect-error: really unused...
  private _tracker: Tracker;
  // @ts-expect-error: really unused...
  private _childPlayers: NodeListOf<HTMLIFrameElement>;
  private _caster?: Caster;

  constructor() {
    const existingPlayer = window[PLAYER_NAMESPACE];
    const addToExistingPlayer = existingPlayer?._addChildPlayer !== undefined;

    if (!addToExistingPlayer) {
      this._load();
      window[PLAYER_NAMESPACE] = this;
      document.dispatchEvent(new CustomEvent(`${PLAYER_NAMESPACE}init`));
    }

    ready(() => {
      const id = `${PLAYER_NAMESPACE}-container`;
      const elements = document.querySelectorAll<HTMLElement>(`.${id}`);

      elements.forEach((element) => {
        element.classList.remove(id);
        element.classList.add(`${id}-processed`);

        if (getComputedStyle(element).position === "static") {
          element.style.position = "relative";
        }

        element.style.overflow = "hidden";

        const playerType =
          element.dataset.type === "default" ? "v4" : element.dataset.type;
        const iframe = document.createElement("iframe");

        if (!playerType || /[^\da-z]/i.test(playerType)) {
          throw new Error("The attribute `data-type` is missing or invalid.");
        }

        iframe.style.border = "none";
        iframe.style.position = "absolute";
        iframe.style.left = "0";
        iframe.style.top = "0";
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.overflow = "hidden";
        iframe.className = `${PLAYER_NAMESPACE}-view`;

        iframe.src = "about:blank";

        const parameters = element.dataset.params ?? "";

        if (addToExistingPlayer) {
          existingPlayer._addChildPlayer({
            element,
            parameters,
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
    iframeWindow.params = parseParameters(childPlayer.parameters);
    iframeDocument.write(
      `<script async src="${PLAYER_DOMAIN}/players/${childPlayer.playerType}.js"></script>`,
    );
    iframeDocument.close();
    iframeDocument.body.style.overflow = "hidden";
  }

  public play() {
    if (!this._loaded) {
      throw new Error("Player not loaded yet.");
    }

    if (this._audioSource) {
      void this._audioSource.context.resume();
    }

    return this._audio.play();
  }

  public pause() {
    this._audio.pause();
  }

  public toggle(originalToggle?: boolean) {
    const toggle = originalToggle ?? !this.playing;
    void this[toggle ? "play" : "pause"]();
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
  public on(eventsOrTypes: EventCallbacks | string, callbacks?: EventHandlers) {
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
    this._events = new Events();
    this._audio = new HTMLPlayerElement(SOURCES, this._events, this);
    this._clock = new Clock(this, this._events);
    this._tracker = new Tracker(this);
    this._childPlayers = document.querySelectorAll(
      `iframe.${PLAYER_NAMESPACE}-view`,
    );
    this._caster = createCaster(this._audio.domPlayer, this._events);

    this._audio.attach();

    try {
      this._audioSource = new AudioSource(this._audio.domPlayer);
    } catch {
      // Do nothing if Web Audio API is unsupported
    }
  }
}
