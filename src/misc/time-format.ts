function zeroFill(value: number, width: number) {
    width -= value.toString().length;
    if (width > 0) {
        const fill = Array.from({
            length: width + (/\./.test(value.toString()) ? 2 : 1),
        }).join('0');
        return `${fill}${value.toString()}`;
    }
    return value.toString();
}

const timeFormat = (seconds: number, noZeroFill = true) => {
    seconds = Math.floor(seconds);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const sec = zeroFill(seconds % 60, 2);
    const min =
        !noZeroFill || hours
            ? zeroFill(minutes % 60, 2)
            : (minutes % 60).toString();

    let returnValue = `${min}:${sec}`;

    if (hours) {
        const hr = noZeroFill ? hours.toString() : zeroFill(hours, 2);
        returnValue = `${hr}:${returnValue}`;
    }

    return returnValue;
};

export default timeFormat;
