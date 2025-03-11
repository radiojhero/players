import type AudioSource from "./audio-source";

export interface AudioAnalysis {
  frequencyL: Uint8Array;
  frequencyR: Uint8Array;
  frequencyMerged: Uint8Array;
  timeDomainL: Uint8Array;
  timeDomainR: Uint8Array;
  timeDomainMerged: Uint8Array;
}

type AnalyseCallback = (data?: AudioAnalysis) => void;

export default class AudioAnalyser {
  private readonly _source: AudioSource;
  private readonly _callback: AnalyseCallback;
  private readonly _analyserL: AnalyserNode;
  private readonly _analyserR: AnalyserNode;
  private readonly _analyserMerged: AnalyserNode;
  private readonly _splitter: ChannelSplitterNode;
  private readonly _merger: ChannelMergerNode;
  private readonly _frequencyL: Uint8Array;
  private readonly _frequencyR: Uint8Array;
  private readonly _frequencyMerged: Uint8Array;
  private readonly _timeDomainL: Uint8Array;
  private readonly _timeDomainR: Uint8Array;
  private readonly _timeDomainMerged: Uint8Array;
  private _analysing: boolean;

  constructor(source: AudioSource, callback: AnalyseCallback) {
    const audioContext = source.context;
    this._source = source;
    this._analyserL = audioContext.createAnalyser();
    this._analyserR = audioContext.createAnalyser();
    this._analyserMerged = audioContext.createAnalyser();
    this._splitter = audioContext.createChannelSplitter();
    this._merger = audioContext.createChannelMerger();

    this._source.connect(this._splitter);
    this._splitter.connect(this._analyserL, 0);
    this._splitter.connect(this._analyserR, 1);
    this._analyserL.connect(this._merger, 0, 0);
    this._analyserR.connect(this._merger, 0, 1);
    this._merger.connect(this._analyserMerged);

    this._frequencyL = new Uint8Array(this._analyserL.frequencyBinCount);
    this._timeDomainL = new Uint8Array(this._analyserL.fftSize);

    this._frequencyR = new Uint8Array(this._analyserR.frequencyBinCount);
    this._timeDomainR = new Uint8Array(this._analyserR.fftSize);

    this._frequencyMerged = new Uint8Array(
      this._analyserMerged.frequencyBinCount,
    );
    this._timeDomainMerged = new Uint8Array(this._analyserMerged.fftSize);

    this._callback = callback;
  }

  public cleanup() {
    this._source.disconnect(this._splitter);
    this._analyserMerged.disconnect();
  }

  public start = () => {
    if (this._analysing) {
      return;
    }

    requestAnimationFrame(this._frame);
    this._analysing = true;
  };

  public stop = () => {
    if (!this._analysing) {
      return;
    }

    this._analysing = false;
    this._callback();
  };

  private readonly _frame = () => {
    if (!this._analysing) {
      return;
    }

    requestAnimationFrame(this._frame);

    try {
      this._analyserL.getByteFrequencyData(this._frequencyL);
      this._analyserL.getByteTimeDomainData(this._timeDomainL);

      this._analyserR.getByteFrequencyData(this._frequencyR);
      this._analyserR.getByteTimeDomainData(this._timeDomainR);

      this._analyserMerged.getByteFrequencyData(this._frequencyMerged);
      this._analyserMerged.getByteTimeDomainData(this._timeDomainMerged);

      this._callback({
        frequencyL: this._frequencyL,
        frequencyR: this._frequencyR,
        frequencyMerged: this._frequencyMerged,
        timeDomainL: this._timeDomainL,
        timeDomainR: this._timeDomainR,
        timeDomainMerged: this._timeDomainMerged,
      });
    } catch (error) {
      this.stop();
      throw error;
    }
  };
}
