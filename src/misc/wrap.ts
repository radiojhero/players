interface WrappableFunction<T> extends Function {
    __wrappers__?: {
        guards: unknown[];
        wrapper: T;
    }[];
}

export function unwrap<T extends WrappableFunction<T>>(
    callback: T,
    ...guards: unknown[]
) {
    if (callback.__wrappers__ !== undefined) {
        const toRemove = callback.__wrappers__.filter(entry =>
            guards.every(item => entry.guards.indexOf(item) !== -1),
        );
        callback.__wrappers__ = callback.__wrappers__.filter(
            entry => toRemove.indexOf(entry) === -1,
        );

        return toRemove[0].wrapper;
    }

    return;
}

export function wrap<T extends WrappableFunction<T>>(
    callback: T,
    wrapper: T,
    ...guards: unknown[]
) {
    if (callback.__wrappers__ === undefined) {
        callback.__wrappers__ = [];
    }

    unwrap(callback, ...guards);
    callback.__wrappers__.push({ guards, wrapper });
    return wrapper;
}
