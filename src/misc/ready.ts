type Callback = () => void;
const callbacks: Callback[] = [];
let loaded = /^(?:interactive|complete)$/.test(document.readyState);

if (!loaded) {
    document.addEventListener('DOMContentLoaded', function listener() {
        document.removeEventListener('DOMContentLoaded', listener);
        loaded = true;

        while (callbacks.length > 0) {
            callbacks.shift()?.();
        }
    });
}

export default (callback: Callback) => {
    if (loaded) {
        setTimeout(callback, 0);
        return;
    }

    callbacks.push(callback);
};
