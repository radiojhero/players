import Events from '../events';
import Caster from '.';

export default class ChromecastCaster extends Caster {
    protected readonly _type = 'chromecast';
    private _chromecastCallbackId = -1;

    constructor(audio: HTMLAudioElement, events: Events) {
        super(audio, events);

        const remote = audio.remote;
        remote.addEventListener('connect', this._updateStatus);
        remote.addEventListener('connecting', this._updateStatus);
        remote.addEventListener('disconnect', this._updateStatus);
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
