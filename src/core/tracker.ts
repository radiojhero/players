import type Player from "./player";

export default class Tracker {
  private readonly _player: Player;
  private _isTracking = false;
  private _iframe?: HTMLIFrameElement;

  constructor(player: Player) {
    this._player = player;
    this._player.on("buffering play", () => {
      this.trackPlay(true);
    });
    this._player.on("pause", () => {
      this.trackPlay(false);
    });
  }

  public trackPlay(playing: boolean) {
    if (this._isTracking === playing) {
      return;
    }

    this._isTracking = playing;

    if (!playing) {
      this.removeIframe();
      return;
    }

    this.addIframe();
  }

  private addIframe() {
    const url = document.createElement("a");
    url.href = TRACKER_URL;
    const separator = url.search ? "&" : "?";
    url.search += `${separator}s=${btoa(location.hostname)}`;

    if (!this._iframe) {
      this._iframe = document.createElement("iframe");
      this._iframe.tabIndex = -1;
      this._iframe.setAttribute("aria-hidden", "true");
      this._iframe.style.position = "absolute";
      this._iframe.style.left = "-9999px";
      this._iframe.style.top = "0";
      this._iframe.src = url.href;
    }

    document.body.appendChild(this._iframe);
  }

  private removeIframe() {
    this._iframe?.parentElement?.removeChild(this._iframe);
  }
}
