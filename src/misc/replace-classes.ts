function camelcase(cls: string) {
    return cls.replace(/-+(\w|$)/g, (s0, s1: string) => s1.toUpperCase());
}

export default function replaceClasses(
    html: string,
    css: { [prop: string]: string },
) {
    function substitute(s0: string, s1: string, s2: string) {
        return (
            s1 +
            s2
                .split(/\s+/)
                .map(cls => css[camelcase(cls)])
                .join(' ')
        );
    }

    return html
        .replace(/(<.*?\sclass=")([^"]+)/g, substitute)
        .replace(/(<.*?\sclass=')([^']+)/g, substitute)
        .replace(
            /(<.*?\sclass=)([^\s"'<=>`]+)/g,
            (s0, s1: string, s2: string) => {
                let string = substitute(s0, s1, s2);

                if (string === s1) {
                    string = `${s1}""`;
                }

                return string;
            },
        );
}
