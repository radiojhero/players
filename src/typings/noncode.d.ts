declare module '*.html' {
    const content: string;
    export default content;
}

declare module '*.json' {
    const content: any;
    export default content;
}

declare module '*.scss' {
    const content: Record<string, string>;
    export = content;
}
