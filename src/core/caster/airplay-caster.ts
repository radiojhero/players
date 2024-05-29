import Events from '../events';
import Caster from '.';

export default class AirplayCaster extends Caster {
    protected readonly _type = 'airplay';

    constructor(audio: HTMLAudioElement, events: Events) {
        super(audio, events);

        this._audio.addEventListener(
            'webkitcurrentplaybacktargetiswirelesschanged',
            this._updateStatus,
        );
        this._updateStatus();
    }

    public static isSupported() {
        return !!window.WebKitPlaybackTargetAvailabilityEvent;
    }

    private _updateStatus = () => {
        if (this._audio.webkitCurrentPlaybackTargetIsWireless) {
            this._audio.removeEventListener(
                'webkitplaybacktargetavailabilitychanged',
                this._castAvailabilityChange,
            );
            return;
        }

        this._audio.addEventListener(
            'webkitplaybacktargetavailabilitychanged',
            this._castAvailabilityChange,
        );
    };

    private _castAvailabilityChange = (
        event: WebKitPlaybackTargetAvailabilityEvent,
    ) => {
        this._fireAvailabililtyEvent(event.availability === 'available');
    };

    public showCastPicker() {
        this._audio.webkitShowPlaybackTargetPicker();
    }
}
