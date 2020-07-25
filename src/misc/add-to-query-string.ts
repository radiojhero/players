import { parse, stringify } from 'querystring';

export default (url: string, parameters: Record<string, any>) => {
    const path = document.createElement('a');
    path.href = url;
    path.search = `?${stringify({
        ...parse(path.search.slice(1)),
        ...parameters,
    })}`;
    return path.href;
};
