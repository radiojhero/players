export default (root: Element, selector: string) => {
    if (root.closest) {
        return root.closest(selector);
    }

    const matches = (root.ownerDocument ?? document).querySelectorAll(selector);
    let i: number;
    // eslint-disable-next-line unicorn/no-null
    let element: Element | null = root;

    do {
        i = matches.length;
        while (--i >= 0 && matches.item(i) !== element) {
            /* no-op */
        }
        element = element.parentElement;
    } while (i < 0 && element);

    return element;
};
