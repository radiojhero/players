import { EventObject } from '../../../core/events';
import timeFormat from '../../../misc/time-format';
import css from '../scss/index.scss';
import { DefaultPlayer } from '.';
import root from './root';

function updateProgressBar(event: EventObject<number>) {
    const formattedValue = timeFormat(event.detail);
    const fills = root.queryMultiple<HTMLElement>(css.songProgressFill);

    root.queryMultiple<HTMLProgressElement>(css.songProgress).forEach(
        (element, i) => {
            element.value = event.detail;
            fills[i].style.transform = `translateX(${element.position * 100}%)`;
            if (!i) {
                root.query(css.songCurrentTime).textContent = formattedValue;
            }
        },
    );
}

const events = {
    songprogress: updateProgressBar,
};

export function setup(player: DefaultPlayer) {
    player.on(events);
}

export function teardown(player: DefaultPlayer) {
    player.off(events);
}
