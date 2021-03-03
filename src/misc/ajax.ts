import addToQueryString from './add-to-query-string';

type AjaxCallback = (data?: string) => void;

function setupXhr(
    verb: string,
    url: string,
    callback?: AjaxCallback,
    data?: Document | BodyInit,
    credentials = false,
    bustCache = false,
) {
    if (bustCache) {
        url = addToQueryString(url, { _: Date.now() });
    }

    const request = new XMLHttpRequest();
    if (callback) {
        request.addEventListener('load', () => {
            callback(request.responseText);
        });
        request.addEventListener('error', () => {
            callback();
        });
    }
    request.open(verb, url);

    if (credentials) {
        request.withCredentials = credentials;
    }

    request.send(data);
}

export function ajaxGet(
    url: string,
    callback?: AjaxCallback,
    credentials = false,
    bustCache = false,
) {
    setupXhr('GET', url, callback, undefined, credentials, bustCache);
}

export function ajaxPost(
    url: string,
    data: Document | BodyInit,
    callback?: AjaxCallback,
    credentials = false,
    bustCache = false,
) {
    setupXhr('POST', url, callback, data, credentials, bustCache);
}
