import HTMLPlayerElement from './player-dom';
import Events from './events';

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

        mediaSession.setActionHandler('play', () => {
            mediaSession.playbackState = 'playing';
            void this._player.play();
        });
        mediaSession.setActionHandler('pause', () => {
            mediaSession.playbackState = 'paused';
            this._player.pause();
        });

        this._events.on('gotmetadata', event => {
            if (event.detail.song_history.length === 0) {
                return;
            }
            // eslint-disable-next-line prefer-const
            let { artist, title, duration } = event.detail.song_history[0];

            if (!title) {
                title = artist;
                artist = '???';
            }

            const album = event.detail.program.name;
            const artwork = event.detail.program.cover;
            this._setMetadata({ artist, title, album, artwork });

            this._songDuration = duration;
            this._setPosition(duration > 0 ? { duration } : {});
        });

        this._events.on('songprogress', event => {
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
        mediaSession?.setPositionState?.({ duration: 0, ...state });
    }
}
