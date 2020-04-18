/* eslint-disable @typescript-eslint/no-explicit-any, compat/compat, @typescript-eslint/unbound-method, unicorn/consistent-function-scoping */

const win = window as any;

// Micropolyfill for ES6 reflections
// Needed as a babel-plugin-transform-builtin-extend helper
if (!win.Reflect) {
    win.Reflect = {
        construct(target: any, parameters: any[]) {
            return new (Function.prototype.bind.apply(
                target,
                [null].concat(parameters) as any,
            ))();
        },
    };
}

// No-op Array.from() for IE
// Needed as a babel-plugin-transform-builtin-extend helper
if (!Array.from) {
    Array.from = (_: any) => Array.prototype.slice.call(_);
}

// CustomEvent for IE
(function () {
    if (typeof window.CustomEvent === 'function') {
        return;
    }

    function CustomEvent<T>(type: string, parameters: CustomEventInit<T>) {
        parameters = parameters ?? {};
        const eventObject = document.createEvent('CustomEvent');
        eventObject.initCustomEvent(
            type,
            parameters.bubbles ?? false,
            parameters.cancelable ?? false,
            parameters.detail ?? null,
        );
        return eventObject;
    }

    (window as any).CustomEvent = CustomEvent;
})();
