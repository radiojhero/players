// CustomEvent for IE
(() => {
  if (typeof window.CustomEvent === "function") {
    return;
  }

  function CustomEvent<T>(type: string, parameters: CustomEventInit<T> = {}) {
    const eventObject = document.createEvent("CustomEvent");
    eventObject.initCustomEvent(
      type,
      parameters.bubbles ?? false,
      parameters.cancelable ?? false,
      parameters.detail ?? null,
    );
    return eventObject;
  }

  (window as any).CustomEvent = CustomEvent;
})();
