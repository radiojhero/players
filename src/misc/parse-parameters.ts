const parseParameters = (parameters: string) => {
    const result: Record<string, string> = {};

    parameters.split('&').forEach(part => {
        const [key, value] = part.split('=');
        result[key] = value;
    });

    return result;
};

export default parseParameters;
