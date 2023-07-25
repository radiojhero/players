# Contributing

Good to see you're interested in contributing to us! Before contributing code
or reporting an issue, you should read this document throughly, as it outlines
all you need to know before doing so. We're a really small team after all, so
following the guidelines here will help us address issues (including _yours_)
more easily.

## Setting up development

You must install Node.js and PNPM first.

1.  Fork this repository on GitHub;
2.  Clone it to your machine and `cd` to it;
3.  Run `pnpm install`;
4.  Copy `player-settings.example.json` to `player-settings.json` and edit
    it accordingly;
5.  Run `pnpm start` to view and monitor your changes in the browser;
6.  If that didn't open a browser window, access `http://localhost:8080/`;
7.  Work your magic.

## Opening issues

-   Use the [issue tracker][1] to report bugs and request features or support.
-   Make sure you've searched all open _and closed_ issues before opening yours.
    If your issue has been reported before, you may or may not want to
    participate on it.
-   When reporting a bug, be sure to provide a reduced test case.
-   Be respectful!

[1]: https://github.com/radiojhero/players/issues

## Submitting pull requests

-   As with issues, make sure a similar PR wasn't submitted before.
-   Before venturing on something big, open an issue about it first. Let us know
    and evaluate whether your idea is worthwhile, or you may end up wasting time
    on something we might not want to merge into the repository.
-   Don't forget to `pnpm run lint` before submitting your PR, so as to make 
    sure the code adheres to our standards.
-   Remember you can still push more commits to your branch when needed after
    submitting your PR; you'll probably want to do this based on feedback.

## Known issues / TODOs / Help wanted

-   This needs test suites! What a shame... orz
