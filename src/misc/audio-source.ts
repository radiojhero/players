import Gain from "./gain";

export default class AudioSource {
  public get connectedNodes() {
    return [...this._connectedNodes];
  }

  public get context() {
    return this._node.context as AudioContext;
  }

  private readonly _node: AudioNode;
  private readonly _gain: Gain;
  private _connectedNodes: AudioNode[] = [];

  constructor(element: HTMLMediaElement) {
    const audioContext = new AudioContext();
    this._node = audioContext.createMediaElementSource(element);
    this._gain = new Gain(audioContext, this._node);
  }

  public get volume() {
    return this._gain.volume;
  }

  public set volume(level) {
    this._gain.volume = level;
  }

  public fadeIn() {
    this._gain.fadeIn();
  }

  public fadeOut() {
    this._gain.fadeOut();
  }

  public connect(node: AudioNode) {
    this._node.connect(node);
    this._connectedNodes.push(node);
  }

  public disconnect(node: AudioNode) {
    try {
      this._node.disconnect(node);
    } catch {
      //
    }

    this._connectedNodes = this._connectedNodes.filter((n) => n !== node);
  }
}
