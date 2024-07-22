import * as css from '../scss/index.scss';
import root from './root';
import { setupRequests } from './song-requests';

let selectedTab: HTMLButtonElement;

export function setup() {
    root.query(css.tabsList).addEventListener('click', event => {
        const target = event.target as Element;

        if (target instanceof HTMLButtonElement) {
            event.preventDefault();

            selectedTab.removeAttribute('aria-selected');
            document
                .querySelector(
                    `#${selectedTab.getAttribute('aria-controls') ?? ''}`,
                )
                ?.classList.add(css.hidden);

            target.setAttribute('aria-selected', 'true');
            document
                .querySelector(`#${target.getAttribute('aria-controls') ?? ''}`)
                ?.classList.remove(css.hidden);

            selectedTab = target;
        }
    });

    document.querySelector('#requests-tab')?.addEventListener('click', () => {
        setupRequests();
    });

    selectedTab = root.query<HTMLButtonElement>(css.tabsTab);
}
