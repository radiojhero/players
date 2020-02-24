import css from '../scss/index.scss';
import { DefaultPlayer } from '.';
import root from './root';

const pausedGroup = [css.stoppedMessage];
const playingGroup = [css.bannerInner, css.programMetadata, css.songMetadata];
let isPlaying = false;
let transitionState = -1;

export default function togglePlayState(
    player: DefaultPlayer,
    toggle: boolean,
    withTransitions = true,
) {
    if (toggle === isPlaying) {
        return;
    }

    isPlaying = toggle;

    const toShow = isPlaying ? playingGroup : pausedGroup;
    const toHide = isPlaying ? pausedGroup : playingGroup;
    const transitionStateFactor = isPlaying ? 1 : -1;

    if (!withTransitions) {
        transitionState = transitionStateFactor;

        toShow.forEach(cls => {
            root.query(cls).classList.remove(css.hidden);
        });

        toHide.forEach(cls => {
            root.query(cls).classList.add(css.hidden);
        });

        return;
    }
    transitionState += transitionStateFactor;

    if (transitionState === transitionStateFactor) {
        toShow.forEach(cls => {
            root.query(cls).classList.remove(css.hidden);
        });
        return;
    }

    let addedTransition = false;
    toHide.forEach(cls => {
        const element = root.query(cls);
        element.classList.add(css.hidden);

        function completeTransition() {
            if (!transitionState) {
                return;
            }

            toShow.forEach(cls2 => {
                root.query(cls2).classList.remove(css.hidden);
            });

            transitionState += transitionStateFactor;
        }

        if (!addedTransition && element.getClientRects().length > 0) {
            addedTransition = true;
            element.addEventListener('transitionend', function transitionEnd() {
                element.removeEventListener('transitionend', transitionEnd);
                completeTransition();
            });
        }
    });
}
