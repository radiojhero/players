import type Events from "../events";

export default abstract class Caster {
  protected abstract readonly _type: string;
  protected _audio: HTMLAudioElement;
  protected _events: Events;
  protected _available: boolean;

  constructor(audio: HTMLAudioElement, events: Events) {
    this._audio = audio;
    this._events = events;
  }

  public static isSupported() {
    return false;
  }

  public abstract showCastPicker(): void;

  public get status() {
    return {
      type: this._type,
      available: this._available,
    };
  }

  protected _fireAvailabililtyEvent(available: boolean) {
    this._available = available;
    this._events.fire("castavailabilitychange");
  }
}
