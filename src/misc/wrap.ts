interface WrappableFunction<T> extends Function {
    __wrappers__?: {
        guards: unknown[];
        wrapper: T;
    }[];
}

export function unwrap<T extends WrappableFunction<T>>(
    func: T,
    ...guards: unknown[]
) {
    if (func.__wrappers__ !== undefined) {
        const toRemove = func.__wrappers__.filter(entry =>
            guards.every(item => entry.guards.indexOf(item) !== -1),
        );
        func.__wrappers__ = func.__wrappers__.filter(
            entry => toRemove.indexOf(entry) === -1,
        );

        return toRemove[0].wrapper;
    }

    return undefined;
}

export function wrap<T extends WrappableFunction<T>>(
    func: T,
    wrapper: T,
    ...guards: unknown[]
) {
    if (func.__wrappers__ === undefined) {
        func.__wrappers__ = [];
    }

    unwrap(func, ...guards);
    func.__wrappers__.push({ guards, wrapper });
    return wrapper;
}
