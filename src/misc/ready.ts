type Callback = () => void;
const funcs: Callback[] = [];
let loaded = /^(?:interactive|complete)$/.test(document.readyState);

if (!loaded) {
    document.addEventListener('DOMContentLoaded', function listener() {
        document.removeEventListener('DOMContentLoaded', listener);
        loaded = true;

        while (funcs.length) {
            funcs.shift()?.();
        }
    });
}

export default (func: Callback) => {
    if (loaded) {
        setTimeout(func, 0);
        return;
    }

    funcs.push(func);
};
