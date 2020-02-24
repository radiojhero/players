import css from '../scss/index.scss';
import { DefaultPlayer } from '.';
import root from './root';

let player: DefaultPlayer;

function setVolume() {
    player.volume =
        parseFloat(root.query<HTMLInputElement>(css.volumeRange).value) / 100;
}

function repaintRange() {
    const volumeRange = root.query<HTMLInputElement>(css.volumeRange);
    const volume = player.volume === -1 ? 1 : player.volume;

    const stop = volume * 100;
    volumeRange.value = stop.toString();

    const thumb = root.query<HTMLElement>(css.volumeRangeThumb);
    const thumbSize = parseFloat(getComputedStyle(thumb).width);
    const track = root.query<HTMLElement>(css.volumeRangeTrack);
    const trackSize = parseFloat(
        getComputedStyle(root.query(css.volumeRangeWrapper)).width,
    );
    const trackPadding =
        ((thumbSize * volume - thumbSize / 2) * 100) / trackSize;
    const fill = root.query<HTMLElement>(css.volumeRangeFill);

    thumb.style.left = `${(stop * (trackSize - thumbSize)) / trackSize}%`;
    track.style.width = `${100 - stop + trackPadding}%`;
    fill.style.width = `${stop - trackPadding}%`;

    const volumeWaves = root.query(css.volumeWaves);
    volumeWaves.classList.remove(css.vol0);
    volumeWaves.classList.remove(css.vol25);
    volumeWaves.classList.remove(css.vol50);

    volumeWaves.classList.add(
        css[`vol${Math.floor(Math.min(stop, 99) / 25) * 25}`],
    );
}

const events = {
    volumechange: repaintRange,
};

export function setup(thePlayer: DefaultPlayer) {
    player = thePlayer;

    const volumeRange = root.query<HTMLInputElement>(css.volumeRange);

    if (player.volume === -1) {
        volumeRange.disabled = true;
    } else {
        volumeRange.addEventListener('input', setVolume);
        volumeRange.addEventListener('change', setVolume);
        player.on(events);
    }

    window.addEventListener('resize', repaintRange);
    repaintRange();
}

export function teardown() {
    if (player.volume !== -1) {
        player.off(events);
    }

    window.removeEventListener('resize', repaintRange);
}
