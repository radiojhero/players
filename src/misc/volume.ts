let cached: boolean | undefined;

export default () => {
    if (cached === undefined) {
        const test = document.createElement('audio');
        test.volume = 0.5;
        cached = test.volume === 0.5;
    }

    return cached;
};
