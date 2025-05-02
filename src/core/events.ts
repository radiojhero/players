import type { Metadata } from "./metadata";

export interface EventObject<T = any> {
  type: string;
  detail: T;
}

type EventHandler<T = any> = (event: EventObject<T>) => void;
export type EventHandlers<T = any> = EventHandler<T> | EventHandler<T>[];

export interface EventDetailMap {
  play: never;
  pause: never;
  buffering: never;
  volumechange: never;
  gotmetadata: Metadata;
  error: never;
  metadataerror: never;
  songprogress: number;
  castavailabilitychange: never;
  sourcechange: never;
}

export type EventCallbacks = {
  [eventType in keyof EventDetailMap]?: EventHandlers<
    EventDetailMap[eventType]
  >;
} & Record<string, EventHandlers>;

type EventCallbacksInternal = {
  [eventType in keyof EventDetailMap]: EventHandler[];
};

export default class Events {
  private readonly _callbacks: EventCallbacksInternal =
    {} as EventCallbacksInternal;

  public on(events: EventCallbacks): void;
  public on<T extends keyof EventDetailMap>(
    types: T,
    callbacks: EventHandlers<EventDetailMap[T]>,
  ): void;
  public on(types: string, callbacks: EventHandlers): void;
  public on(
    eventsOrTypes: EventCallbacks | string,
    callbacks?: EventHandlers,
  ): void;
  public on(eventsOrTypes: EventCallbacks | string, callbacks?: EventHandlers) {
    if (typeof eventsOrTypes !== "string") {
      Object.keys(eventsOrTypes).forEach((types) => {
        this.on(types, eventsOrTypes[types]);
      });
      return;
    }

    this._initTypes(eventsOrTypes).forEach((type) => {
      if (callbacks) {
        this._callbacks[type] = this._callbacks[type].concat(callbacks);
      }
    });
  }

  public hasBindings(types: string, all = false) {
    return this._initTypes(types)[all ? "every" : "some"](
      (type) => this._callbacks[type].length > 0,
    );
  }

  public off(events: EventCallbacks): void;
  public off<T extends keyof EventDetailMap>(
    types: T,
    callbacks?: EventHandlers<EventDetailMap[T]>,
  ): void;
  public off(
    eventsOrTypes: EventCallbacks | string,
    callbacks?: EventHandlers,
  ): void;
  public off(
    eventsOrTypes: EventCallbacks | string,
    callbacks?: EventHandlers,
  ) {
    if (typeof eventsOrTypes !== "string") {
      Object.keys(eventsOrTypes).forEach((types) => {
        this.off(types, eventsOrTypes[types]);
      });
      return;
    }

    let callbacksArray: EventHandler[] = [];

    if (callbacks) {
      callbacksArray = callbacksArray.concat(callbacks);
    }

    this._initTypes(eventsOrTypes).forEach((type) => {
      if (callbacksArray.length === 0) {
        this._callbacks[type] = [];
        return;
      }

      this._callbacks[type] = this._callbacks[type].filter(
        (callback) => callbacksArray.indexOf(callback) === -1,
      );
    });
  }

  public fire<T extends keyof EventDetailMap>(
    type: T,
    detail?: EventDetailMap[T],
  ) {
    this._callbacks[type]?.forEach((callback) => {
      callback({ type, detail });
    });
  }

  private _initTypes(types: string) {
    const typeArray = types.split(/\s+/g).map((t) => t as keyof EventDetailMap);

    typeArray.forEach((type) => {
      this._callbacks[type] ??= [];
    });

    return typeArray;
  }
}
