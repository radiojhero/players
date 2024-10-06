import * as css from '../scss/index.scss';
import { DefaultPlayer } from '.';
import root from './root';

let currentSongText: string | undefined;
let originalSongTextRight: number;
let mimickedSongTextLeft: number;
let marqueeFrame: number;
let marqueeTimeout: number;
let marqueeScrolled: number;
let marqueeDelta: number;
let marqueeStarted: number;
let progress: number;
let previousProgress: number;
let playerObject: DefaultPlayer;

function pauseMarquee() {
    cancelAnimationFrame(marqueeFrame);
    clearTimeout(marqueeTimeout);
    marqueeStarted = -1;
    previousProgress = progress;
}

function stopMarquee() {
    if (playerObject.continuousMetadata) {
        return;
    }

    pauseMarquee();
    currentSongText = '';
}

function runMarqueeFrame(force: boolean, timestamp?: number) {
    if (timestamp === undefined) {
        timestamp = performance.now();
    }

    if (marqueeStarted < 0) {
        marqueeStarted = timestamp;
        marqueeFrame = requestAnimationFrame(ts => {
            runMarqueeFrame(force, ts);
        });
        return;
    }

    const currentSongWrapper = root.query(css.songCurrent);
    const currentSong = root.query<HTMLElement>(css.songCurrentScrollable);

    if (!(force || marqueeScrolled)) {
        pauseMarquee();
        marqueeTimeout = window.setTimeout(() => {
            runMarqueeFrame(true);
        }, 1500);
        return;
    }

    marqueeFrame = requestAnimationFrame(ts => {
        runMarqueeFrame(false, ts);
    });

    progress = previousProgress + ((timestamp - marqueeStarted) * 60) / 1000;
    marqueeScrolled = progress * marqueeDelta;
    currentSong.style.transform = `translate3d(-${marqueeScrolled.toString()}px, 0, 0)`;

    currentSongWrapper.classList[
        marqueeScrolled < originalSongTextRight ? 'add' : 'remove'
    ](css.leftOverflow);

    if (marqueeScrolled > mimickedSongTextLeft) {
        marqueeScrolled = progress = 0;
        currentSong.style.transform = '';
    }
}

function resumeMarquee() {
    runMarqueeFrame(false);
}

function maybeDoMarquee(force = false) {
    const currentSongWrapper = root.query(css.songCurrent);
    const currentSong = root.query<HTMLElement>(css.songCurrentScrollable);
    const originalSongText =
        currentSong.querySelector<HTMLElement>('span:not([class])');
    let mimickedSongText = originalSongText?.nextSibling as
        | HTMLElement
        | undefined;

    if (
        (!force && currentSongText === originalSongText?.textContent) ||
        !originalSongText
    ) {
        return;
    }

    pauseMarquee();
    marqueeScrolled = progress = previousProgress = 0;
    currentSong.style.transform = '';
    currentSongWrapper.classList.remove(css.leftOverflow);
    currentSongWrapper.classList.remove(css.rightOverflow);
    currentSongWrapper.removeEventListener('mouseenter', pauseMarquee);
    currentSongWrapper.removeEventListener('mouseleave', resumeMarquee);
    currentSongText = originalSongText.textContent ?? '';

    if (mimickedSongText) {
        currentSong.removeChild(mimickedSongText);
    }

    if (currentSongWrapper.clientWidth >= currentSongWrapper.scrollWidth) {
        return;
    }

    currentSongWrapper.classList.add(css.rightOverflow);
    currentSongWrapper.addEventListener('mouseenter', pauseMarquee);
    currentSongWrapper.addEventListener('mouseleave', resumeMarquee);
    mimickedSongText = originalSongText.cloneNode(true) as HTMLElement;
    mimickedSongText.classList.add(css.mimic);
    mimickedSongText.setAttribute('aria-hidden', 'true');
    currentSong.appendChild(mimickedSongText);

    const currentSongLeft = currentSongWrapper.getBoundingClientRect().left;
    originalSongTextRight =
        originalSongText.getBoundingClientRect().right - currentSongLeft;
    mimickedSongTextLeft =
        (originalSongText.nextSibling as Element).getBoundingClientRect().left -
        currentSongLeft;
    marqueeDelta = root.query(css.measure).getBoundingClientRect().width;

    runMarqueeFrame(false);
}

function updateMarquee() {
    maybeDoMarquee();
}

function doMarquee() {
    maybeDoMarquee(true);
}

const events = {
    pause: stopMarquee,
    gotmetadata: updateMarquee,
};

export function setup(player: DefaultPlayer) {
    playerObject = player;
    window.addEventListener('resize', doMarquee);
    player.on(events);
    updateMarquee();
}

export function teardown(player: DefaultPlayer) {
    window.removeEventListener('resize', doMarquee);
    player.off(events);
}
