const addToQueryString = (url: string, parameters: string) => {
    const path = document.createElement('a');
    path.href = url;

    const symbol = path.search ? '&' : '?';

    path.search += symbol + parameters;
    return path.href;
};

export default addToQueryString;
