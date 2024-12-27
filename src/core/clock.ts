import Events, { EventObject } from './events';
import { Metadata } from './metadata';
import Player from './player';

export default class Clock {
    private readonly _player: Player;
    private readonly _events: Events;
    private _lastUpdateTime: number;
    private _songStart: number;
    private _songNow: number;
    private _songDuration: number;
    private _progressAnimationFrame: number;

    constructor(player: Player, events: Events) {
        this._player = player;
        this._events = events;
        player.on('gotmetadata', this._gotMetadata);
        player.on('pause', () => {
            if (this._player.continuousMetadata) {
                return;
            }

            this._stop();
        });
    }

    private readonly _gotMetadata = (event: EventObject<Metadata>) => {
        const song = event.detail.song_history[0];
        this._songStart = song.start_time;
        this._songNow = event.detail.current_time;
        this._songDuration = song.duration;
        this._lastUpdateTime = performance.now();
        this._stop();

        this._tick();
    };

    private readonly _tick = () => {
        let songProgress =
            this._songNow -
            this._songStart +
            (performance.now() - this._lastUpdateTime) /
                (TIMESTAMPS_IN_SECONDS ? 1000 : 1);

        if (this._songDuration > 0 && songProgress >= this._songDuration) {
            this._stop();
            songProgress = this._songDuration;
            this._player.fetchMetadata();
        }

        this._progressAnimationFrame = requestAnimationFrame(this._tick);
        this._events.fire('songprogress', songProgress);
    };

    private _stop() {
        cancelAnimationFrame(this._progressAnimationFrame);
    }
}
