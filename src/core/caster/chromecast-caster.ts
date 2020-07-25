import HTMLPlayerElement from '../player-dom';
import Events from '../events';
import Caster from '.';

export default class ChromecastCaster extends Caster {
    protected readonly _type = 'chromecast';
    private _chromecastCallbackId = -1;

    constructor(audio: HTMLPlayerElement, events: Events) {
        super(audio, events);

        const remote = audio.remote;
        remote.onconnect = this._updateStatus;
        remote.onconnecting = this._updateStatus;
        remote.ondisconnect = this._updateStatus;
        this._updateStatus();
    }

    public static isSupported() {
        return !!document.createElement('audio').remote;
    }

    private _updateStatus = () => {
        const remote = this._audio.remote;
        if (remote.state == 'disconnected') {
            this._audio.remote
                .watchAvailability(this._castAvailabilityChange)
                .then((id: number) => {
                    this._chromecastCallbackId = id;
                })
                .catch(() => {
                    this._castAvailabilityChange(true);
                });
            return;
        }

        if (this._chromecastCallbackId !== -1) {
            void remote.cancelWatchAvailability(this._chromecastCallbackId);
            this._chromecastCallbackId = -1;
        }
    };

    private _castAvailabilityChange = (available: boolean) => {
        this._fireAvailabililtyEvent(available);
    };

    public showCastPicker() {
        void this._audio.remote.prompt();
    }
}
