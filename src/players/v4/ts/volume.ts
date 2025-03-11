import type { DefaultPlayer } from ".";
import * as css from "../scss/index.scss";
import root from "./root";

let player: DefaultPlayer;

function setVolume() {
  player.volume =
    Number.parseFloat(root.query<HTMLInputElement>(css.volumeRange).value) /
    100;
}

function repaintRange() {
  const volumeRange = root.query<HTMLInputElement>(css.volumeRange);
  const volume = player.volume === -1 ? 1 : player.volume;

  const stop = volume * 100;
  volumeRange.value = stop.toString();

  const thumb = root.query<HTMLElement>(css.volumeRangeThumb);
  const thumbSize = Number.parseFloat(getComputedStyle(thumb).width);
  const track = root.query<HTMLElement>(css.volumeRangeTrack);
  const trackSize = Number.parseFloat(
    getComputedStyle(root.query(css.volumeRangeWrapper)).width,
  );
  const trackPadding = ((thumbSize * volume - thumbSize / 2) * 100) / trackSize;
  const fill = root.query<HTMLElement>(css.volumeRangeFill);

  thumb.style.left = `${((stop * (trackSize - thumbSize)) / trackSize).toString()}%`;
  track.style.width = `${(100 - stop + trackPadding).toString()}%`;
  fill.style.width = `${(stop - trackPadding).toString()}%`;

  const volumeWaves = root.query(css.volumeWaves);
  volumeWaves.classList.remove(css.vol0);
  volumeWaves.classList.remove(css.vol25);
  volumeWaves.classList.remove(css.vol50);

  volumeWaves.classList.add(
    css[`vol${(Math.floor(Math.min(stop, 99) / 25) * 25).toString()}`],
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
    volumeRange.addEventListener("input", setVolume);
    volumeRange.addEventListener("change", setVolume);
    player.on(events);
  }

  window.addEventListener("resize", repaintRange);
  repaintRange();
}

export function teardown() {
  if (player.volume !== -1) {
    player.off(events);
  }

  window.removeEventListener("resize", repaintRange);
}
