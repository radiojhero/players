import css from '../scss/index.scss';
import root from './root';
import { setupRequests } from './song-requests';

function togglePanes(toggle: boolean) {
    root.query(css.mainPane).classList[toggle ? 'add' : 'remove'](css.hidden);
    root.query(css.extraPane).classList[toggle ? 'remove' : 'add'](css.hidden);
    root.query<HTMLButtonElement>(toggle ? css.backBtn : css.moreBtn).focus();

    const requestsTab = document.querySelector('#requests-tab');

    if (
        requestsTab?.getAttribute('aria-selected') === 'true' &&
        requestsTab?.getClientRects().length
    ) {
        setupRequests();
    }
}

export function setup() {
    root.query(css.moreBtn).addEventListener('click', () => {
        togglePanes(true);
    });

    root.query(css.backBtn).addEventListener('click', () => {
        togglePanes(false);
    });
}
