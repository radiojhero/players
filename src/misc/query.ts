import closest from './closest';
import ready from './ready';
import * as wrapper from './wrap';

export default class SimpleQuery {
    private _context: Element;

    public constructor(rootClass?: string) {
        ready(() => {
            this._context = document.body;

            if (rootClass) {
                const context = document.querySelector(`.${rootClass}`);
                if (!context) {
                    throw new Error(`No ${rootClass} element found.`);
                }

                this._context = context;
            }
        });
    }

    public query<T extends Element = Element>(id: string) {
        return this.queryMultiple<T>(id)[0];
    }

    public queryMultiple<T extends Element = Element>(id: string) {
        return Array.from(this._context.querySelectorAll<T>(`.${id}`));
    }

    public addDelegateEventListener(
        event: string,
        delegate: string,
        callback: (event: Event) => void,
    ) {
        delegate = `.${delegate}`;

        const wrap = (event: Event) => {
            const delegateTarget = closest(event.target as Element, delegate);

            if (delegateTarget?.matches(delegate)) {
                callback.call(delegateTarget, event);
            }
        };

        this._context.addEventListener(
            event,
            wrapper.wrap(callback, wrap, event, delegate, this._context),
        );
    }

    public removeDelegateEventListener(
        event: string,
        delegate: string,
        callback: (event: Event) => void,
    ) {
        const listener = wrapper.unwrap(
            callback,
            event,
            delegate,
            this._context,
        );

        if (listener) {
            this._context.removeEventListener(event, listener);
        }
    }

    public get innerHTML() {
        return this._context.innerHTML;
    }

    public set innerHTML(html) {
        this._context.innerHTML = html;
    }
}
