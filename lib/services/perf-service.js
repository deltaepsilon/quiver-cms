var minify = require('html-minifier').minify;

return module.exports = {
    processHTML: function(html) {
        if (!html || !html.length) {
            return html;
        }

        return minify(html, {
            removeComments: true,
            collapseWhitespace: true,
            caseSensitive: true
        });
    }
}