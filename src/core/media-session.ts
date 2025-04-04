import type Events from "./events";
import type HTMLPlayerElement from "./player-dom";

const mediaSession = navigator.mediaSession;

export default class MediaSessionWrapper {
  private _player: HTMLPlayerElement;
  private _events: Events;
  private _songDuration: number;

  constructor(player: HTMLPlayerElement, events: Events) {
    this._player = player;
    this._events = events;
  }

  public attach() {
    if (!mediaSession) {
      return;
    }

    mediaSession.setActionHandler("play", () => {
      mediaSession.playbackState = "playing";
      void this._player.play();
    });
    mediaSession.setActionHandler("pause", () => {
      mediaSession.playbackState = "paused";
      this._player.pause();
    });

    this._events.on("gotmetadata", (event) => {
      if (event.detail.song_history.length === 0) {
        return;
      }

      let { album, artist, title, duration, cover } =
        event.detail.song_history[0];

      if (!title) {
        title = artist;
        artist = "???";
      }

      const artwork =
        (cover?.length ?? 0) > 0 ? cover : event.detail.program.cover;
      this._setMetadata({ artist, title, album, artwork });

      this._songDuration = duration;
      this._setPosition(duration > 0 ? { duration } : {});
    });

    this._events.on("songprogress", (event) => {
      this._setPosition(
        this._songDuration > 0
          ? {
              duration: this._songDuration,
              position: Math.min(this._songDuration, event.detail),
            }
          : {},
      );
    });
  }

  public detach() {
    //
  }

  private _setMetadata(metadata: MediaMetadataInit) {
    if (!mediaSession) {
      return;
    }

    mediaSession.metadata = new MediaMetadata(metadata);
  }

  private _setPosition(state: MediaPositionState) {
    if (!TIMESTAMPS_IN_SECONDS) {
      state.duration = (state.duration ?? 0) / 1000;
      state.position = (state.position ?? 0) / 1000;
    }
    mediaSession?.setPositionState({ duration: 0, ...state });
  }
}
