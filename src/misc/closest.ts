export default (root: Element, selector: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (root.closest) {
        return root.closest(selector);
    }

    const matches = root.ownerDocument.querySelectorAll(selector);
    let index: number;
    // eslint-disable-next-line unicorn/no-null
    let element: Element | null = root;

    do {
        index = matches.length;
        while (--index >= 0 && matches.item(index) !== element) {
            /* no-op */
        }
        element = element.parentElement;
    } while (index < 0 && element);

    return element;
};
