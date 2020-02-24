export default class AudioSource {
    public get connectedNodes() {
        return [...this._connectedNodes];
    }

    public get context() {
        return this._node.context as AudioContext;
    }

    private readonly _node: AudioNode;
    private _connectedNodes: AudioNode[] = [];

    constructor(element: HTMLMediaElement) {
        // eslint-disable-next-line compat/compat
        const audioContext = new AudioContext();
        this._node = audioContext.createMediaElementSource(element);
        this.connect(audioContext.destination);
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

        this._connectedNodes = this._connectedNodes.filter(n => n !== node);
    }
}
