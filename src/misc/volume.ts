let cached: boolean | undefined;

const volume = () => {
    if (cached === undefined) {
        const test = document.createElement('audio');
        test.volume = 0.5;
        cached = test.volume === 0.5;
    }

    return cached;
};

export default volume;
