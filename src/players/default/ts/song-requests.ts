import { ajaxGet, ajaxPost } from '../../../misc/ajax';
import replaceClasses from '../../../misc/replace-classes';
import css from '../scss/index.scss';

let requestsLoaded = false;

function toggleRequestFields(requests: HTMLElement, value: string) {
    Array.from(
        requests.querySelectorAll<HTMLElement>('[data-dependson]'),
    ).forEach(element => {
        const toggle = element.dataset.value === value;
        element.style.display = toggle ? '' : 'none';
        Array.from(
            element.querySelectorAll<HTMLInputElement>(
                'input, select, textarea',
            ),
        ).forEach(input => {
            input.disabled = !toggle;
        });
    });
}

function parseForm(data?: string) {
    if (!data) {
        requestsLoaded = false;
        return;
    }

    data = data
        .replace(/^[\S\s]*(?=<form)/i, '')
        .replace(/(<\/form>)[\S\s]*$/i, '$1');
    const requests = document.querySelector('#requests') as HTMLElement;

    requests.classList.add(css.requests);
    requests.innerHTML = replaceClasses(data, css);

    if (requests.querySelectorAll(`.${css.success}`).length > 0) {
        requests.classList.remove(css.requests);
        requestsLoaded = false;
        return;
    }

    requests.querySelector('form')?.addEventListener('submit', event => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        form.classList.add(css.hidden);
        ajaxPost(form.action, new FormData(form), parseForm);
    });

    const select = requests.querySelector('select');
    select?.addEventListener('change', () => {
        toggleRequestFields(requests, select?.value ?? '');
    });
    toggleRequestFields(requests, select?.value ?? '');
}

export function setupRequests(force = false) {
    if (!force && requestsLoaded) {
        return;
    }

    const requests = document.querySelector('#requests');
    if (!requests) {
        return;
    }

    requests.innerHTML = 'Carregando...';

    requestsLoaded = true;
    ajaxGet(MAIN_WEBSITE_REQUESTS, parseForm);
}
