import ready from "../../../misc/ready";

/**
 * This is code adapted from Lalit Patel's font detector, which is licensed
 * under Apache Software License 2.0.
 *
 * The code is virtually the same of version 0.3, except that I've taken
 * advantage of some ES6+/TypeScript goodies and also fit it to this repo's
 * coding standards.
 *
 * http://www.lalit.org/lab/javascript-css-font-detect/
 */

// A font will be compared against all the three default fonts.
// And if it doesn't match all 3 then that font is not available.
const baseFonts = ["monospace", "sans-serif", "serif"];

// We use m or w because these two characters take up the maximum width.
// And we use a LLi so that the same matching fonts can get separated
const testString = "mmmmmmmmmmlli";

// We test using 72px font size, we may use any size. I guess larger the better.
const testSize = "72px";

const h = document.body;

// Create a SPAN in the document to get the width of the text we use to test
const s = document.createElement("span");
s.style.font = "initial";
s.style.fontSize = testSize;
s.innerHTML = testString;

type FontMap = Record<string, number>;

const defaultWidth: FontMap = {};
const defaultHeight: FontMap = {};

ready(() => {
  baseFonts.forEach((baseFont) => {
    // Get the default width for the three base fonts
    s.style.fontFamily = baseFont;
    h.appendChild(s);
    defaultWidth[baseFont] = s.offsetWidth; // Width for the default font
    defaultHeight[baseFont] = s.offsetHeight; // Height for the defualt font
    h.removeChild(s);
  });
});

const font = (font: string) =>
  baseFonts.some((baseFont) => {
    s.style.fontFamily = `${font},${baseFont}`; // Name of the font along with the base font for fallback.
    h.appendChild(s);
    const matched =
      s.offsetWidth !== defaultWidth[baseFont] ||
      s.offsetHeight !== defaultHeight[baseFont];
    h.removeChild(s);

    return matched;
  });

export default font;
