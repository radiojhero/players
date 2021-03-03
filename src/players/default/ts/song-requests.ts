import { ajaxGet, ajaxPost } from '../../../misc/ajax';
import replaceClasses from '../../../misc/replace-classes';
import css from '../scss/index.scss';

let requestsLoaded = false;

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

    const form = requests.querySelector('form');

    if (!form) {
        requests.innerHTML =
            document.querySelector('#container')?.outerHTML ?? '';
        return;
    }

    form.addEventListener('submit', event => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        form.classList.add(css.hidden);
        const data = new FormData(form);

        if (!data.get('song')) {
            data.set('aba', 'recado');
        }

        ajaxPost(MAIN_WEBSITE_REQUESTS, data, parseForm);
    });
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
