export const FADE_DURATION = 150;

export default class Gain {
  private _baseGain: GainNode;
  private _gain: GainNode;
  private _volume: number;

  private _fadeFrame: number;

  constructor(
    audioContext: AudioContext,
    node: AudioNode,
    volume = PLAYER_INITIAL_VOLUME,
  ) {
    this._volume = volume;
    this._baseGain = audioContext.createGain();
    this._baseGain.gain.value = 1;
    this._gain = audioContext.createGain();
    this._gain.gain.value = volume * volume;
    node.connect(this._baseGain);
    this._baseGain.connect(this._gain);
    this._gain.connect(audioContext.destination);
  }

  public get volume() {
    return this._volume;
  }

  public set volume(level) {
    this._volume = level;
    this._gain.gain.value = level * level;
  }

  public fadeIn() {
    this._fade(false);
  }

  public fadeOut() {
    this._fade(true);
  }

  private _fade(out: boolean) {
    cancelAnimationFrame(this._fadeFrame);

    let start = -1;

    const step: FrameRequestCallback = (timestamp) => {
      if (start === -1) {
        start = timestamp;
      }

      let volume = (timestamp - start) / FADE_DURATION;
      if (out) {
        volume = 1 - volume;
      }

      this._baseGain.gain.value = out
        ? Math.max(0, volume * volume)
        : Math.min(1, volume * volume);

      if (out ? volume > 0 : volume < 1) {
        this._fadeFrame = requestAnimationFrame(step);
      }
    };

    this._fadeFrame = requestAnimationFrame(step);
  }
}
