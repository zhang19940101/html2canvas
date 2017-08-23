'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var testRangeBounds = function testRangeBounds(document) {
    var TEST_HEIGHT = 123;

    if (document.createRange) {
        var range = document.createRange();
        if (range.getBoundingClientRect) {
            var testElement = document.createElement('boundtest');
            testElement.style.height = TEST_HEIGHT + 'px';
            testElement.style.display = 'block';
            document.body.appendChild(testElement);

            range.selectNode(testElement);
            var rangeBounds = range.getBoundingClientRect();
            var rangeHeight = Math.round(rangeBounds.height);
            document.body.removeChild(testElement);
            if (rangeHeight === TEST_HEIGHT) {
                return true;
            }
        }
    }

    return false;
};

// iOS 10.3 taints canvas with base64 images unless crossOrigin = 'anonymous'
var testBase64 = function testBase64(document, src) {
    var img = new Image();
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    return new Promise(function (resolve) {
        // Single pixel base64 image renders fine on iOS 10.3???
        img.src = src;

        var onload = function onload() {
            try {
                ctx.drawImage(img, 0, 0);
                canvas.toDataURL();
            } catch (e) {
                return resolve(false);
            }

            return resolve(true);
        };

        img.onload = onload;
        img.onerror = function () {
            return resolve(false);
        };

        if (img.complete === true) {
            setTimeout(function () {
                onload();
            }, 500);
        }
    });
};

var testSVG = function testSVG(document) {
    var img = new Image();
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    img.src = 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'></svg>';

    try {
        ctx.drawImage(img, 0, 0);
        canvas.toDataURL();
    } catch (e) {
        return false;
    }
    return true;
};

var testForeignObject = function testForeignObject(document) {
    var img = new Image();
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    img.src = 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'><foreignObject><div></div></foreignObject></svg>';

    return new Promise(function (resolve) {
        var onload = function onload() {
            try {
                ctx.drawImage(img, 0, 0);
                canvas.toDataURL();
            } catch (e) {
                return resolve(false);
            }

            return resolve(true);
        };

        img.onload = onload;
        img.onerror = function () {
            return resolve(false);
        };

        if (img.complete === true) {
            setTimeout(function () {
                onload();
            }, 50);
        }
    });
};

var FEATURES = {
    // $FlowFixMe - get/set properties not yet supported
    get SUPPORT_RANGE_BOUNDS() {
        'use strict';

        var value = testRangeBounds(document);
        Object.defineProperty(FEATURES, 'SUPPORT_RANGE_BOUNDS', { value: value });
        return value;
    },
    // $FlowFixMe - get/set properties not yet supported
    get SUPPORT_SVG_DRAWING() {
        'use strict';

        var value = testSVG(document);
        Object.defineProperty(FEATURES, 'SUPPORT_SVG_DRAWING', { value: value });
        return value;
    },
    // $FlowFixMe - get/set properties not yet supported
    get SUPPORT_BASE64_DRAWING() {
        'use strict';

        return function (src) {
            var _value = testBase64(document, src);
            Object.defineProperty(FEATURES, 'SUPPORT_BASE64_DRAWING', { value: function value() {
                    return _value;
                } });
            return _value;
        };
    },
    // $FlowFixMe - get/set properties not yet supported
    get SUPPORT_FOREIGNOBJECT_DRAWING() {
        'use strict';

        var value = testForeignObject(document);
        Object.defineProperty(FEATURES, 'SUPPORT_FOREIGNOBJECT_DRAWING', { value: value });
        return value;
    }
};

exports.default = FEATURES;