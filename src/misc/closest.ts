const closest = (root: Element, selector: string) => {
  if (root.closest) {
    return root.closest(selector);
  }

  const matches = root.ownerDocument.querySelectorAll(selector);
  let index: number;
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

export default closest;
