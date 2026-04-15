// ==UserScript==
// @name         ${name}
// @version      ${version}
// @description  ${description}
// @author       ${author}
// @include      ${target}
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.slim.min.js
// ==/UserScript==
(function() {
    'use strict';
    let retries = 0;
    const interval = setInterval(() => {
        const items = jQuery('.some-item');
        if (retries++ > 20) {
            console.log('give up');
            clearInterval(interval);
            return;
        }
        if (!items.length) {
            return;
        }
        items.each((i, el) => {
            const asEl = jQuery(el);
            // do something with asEl
        });
    }, 500);
})();
