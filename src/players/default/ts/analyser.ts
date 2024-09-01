import AudioAnalyser, { AudioAnalysis } from '../../../misc/analyser';
import * as css from '../scss/index.scss';
import { DefaultPlayer } from '.';
import root from './root';

let visibleCanvases: HTMLCanvasElement[];
const peaks: number[] = [];
const peaksTtl: number[] = [];
let analyser: AudioAnalyser;

function stopAudioAnalysis() {
    const pixelRatio = window.devicePixelRatio;

    visibleCanvases.forEach(canvas => {
        const canvasContext = canvas.getContext('2d');
        const width = canvas.width / pixelRatio;
        const height = canvas.height / pixelRatio;
        canvasContext?.clearRect(0, 0, width, height);
    });
}

function analyseAudio(event?: AudioAnalysis) {
    if (!event) {
        stopAudioAnalysis();
        return;
    }

    const frequencyData = event.frequencyMerged;

    const pixelRatio = window.devicePixelRatio;

    visibleCanvases.forEach(canvas => {
        const canvasContext = canvas.getContext('2d');

        if (!canvasContext) {
            return;
        }

        const width = canvas.width / pixelRatio;
        const height = canvas.height / pixelRatio;

        const slicesNumber = Math.round(width / 10);
        const sliceWidth = width / slicesNumber;
        const sliceValues = new Array<number>(slicesNumber);
        const sliceDivisors = new Array<number>(slicesNumber);
        const frequenciesNumber = frequencyData.length / 2;

        for (let index = 0; index < frequenciesNumber; index++) {
            const sliceIndex = Math.floor(
                (index * slicesNumber) / frequenciesNumber,
            );
            sliceValues[sliceIndex] =
                (sliceValues[sliceIndex] ?? 0) + frequencyData[index];
            sliceDivisors[sliceIndex] = (sliceDivisors[sliceIndex] ?? 0) + 1;
        }

        canvasContext.clearRect(0, 0, width, height);
        canvasContext.fillStyle = getComputedStyle(canvas).color || '#000';

        canvasContext.strokeStyle = getComputedStyle(canvas).borderColor;

        sliceValues.forEach((value, index) => {
            const x = index * sliceWidth;
            const y =
                Math.round((height * value) / (sliceDivisors[index] * 512)) * 2;

            if (peaksTtl[index]) {
                peaksTtl[index]--;
            } else {
                peaks[index] = peaksTtl[index] = 0;
            }

            if (y > peaks[index]) {
                peaks[index] = y;
                peaksTtl[index] = 60;
            }

            canvasContext.fillRect(x, height - y, sliceWidth - 1, height);

            if (peaks[index]) {
                canvasContext.beginPath();
                canvasContext.moveTo(x, height - peaks[index] + 0.5);
                canvasContext.lineTo(
                    x + sliceWidth - 1,
                    height - peaks[index] + 0.5,
                );
                canvasContext.stroke();
                canvasContext.closePath();
            }
        });

        for (let index = 0; index < height; index++) {
            if (index % 2) {
                canvasContext.clearRect(0, height - index, width, 1);
            }
        }
    });
}

function fixCanvas() {
    visibleCanvases = root
        .queryMultiple<HTMLCanvasElement>(css.songAnalyser)
        .filter(canvas => getComputedStyle(canvas).display !== 'none');

    visibleCanvases.forEach(canvas => {
        const canvasContext = canvas.getContext('2d');

        canvas.style.width = canvas.style.height = '';

        if (canvas.getClientRects().length > 0) {
            const pixelRatio = window.devicePixelRatio;
            const rectangle = canvas.getBoundingClientRect();

            canvas.style.width = `${Math.floor(rectangle.width).toString()}px`;
            canvas.style.height = `${Math.floor(rectangle.height).toString()}px`;
            canvas.width = Math.floor(rectangle.width) * pixelRatio;
            canvas.height = Math.floor(rectangle.height) * pixelRatio;
            canvasContext?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        }
    });
}

const events = {
    play: () => {
        analyser.start();
    },
    'pause buffering': () => {
        analyser.stop();
    },
};

export function setup(player: DefaultPlayer) {
    if (!player.audioSource) {
        return;
    }

    analyser = new AudioAnalyser(player.audioSource, analyseAudio);
    window.addEventListener('resize', fixCanvas);
    fixCanvas();
    player.on(events);

    if (player.playing) {
        analyser.start();
    }
}

export function teardown(player: DefaultPlayer) {
    if (!player.audioSource) {
        return;
    }

    window.removeEventListener('resize', fixCanvas);
    player.off(events);
    analyser.cleanup();
}
