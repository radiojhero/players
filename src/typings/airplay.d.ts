declare interface WebKitPlaybackTargetAvailabilityEvent extends Event {
  availability: string;
}

declare interface Window {
  WebKitPlaybackTargetAvailabilityEvent: WebKitPlaybackTargetAvailabilityEvent;
}

declare interface HTMLAudioElement {
  webkitCurrentPlaybackTargetIsWireless: boolean;
  webkitShowPlaybackTargetPicker(): void;

  addEventListener(
    type: "webkitplaybacktargetavailabilitychanged",
    listener: (
      this: HTMLAudioElement,
      event: WebKitPlaybackTargetAvailabilityEvent,
    ) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: "webkitplaybacktargetavailabilitychanged",
    listener: (
      this: HTMLAudioElement,
      event: WebKitPlaybackTargetAvailabilityEvent,
    ) => any,
    options?: boolean | EventListenerOptions,
  ): void;
}
