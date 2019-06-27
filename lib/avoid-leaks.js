/*

micromatch cache memory leak
----------------------------

There is a package that is a deep dependency of render-sender -> imagemin
called micromatch. The version that is currently required by imagemin 
has an implicit cache. So, when serving lots of files with imagemin,
lots of regex's get cached leaking memory.

This bit here attempts to flush that cache periodically so that it
may be garbage collected.

This is wrapped in a try catch because if imagemin eventually switches
to a later version of micromatch that no longer supports this api, then
we don't want our server to break

*/

try {
    const mm = require('micromatch');
    setInterval(function () {
        mm.clearCache();
    }, 1000 * 10); //every 10 minutes
}
catch (e) {
    console.error('image-serve/avoid-leaks.js: issue with micromatch leak prevention:', e);
    console.error('it is possible that leak prevention is no longer necessary');
}
