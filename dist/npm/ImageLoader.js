'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ImageStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Feature = require('./Feature');

var _Feature2 = _interopRequireDefault(_Feature);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// $FlowFixMe
var ImageLoader = function () {
    function ImageLoader(options, logger, window) {
        _classCallCheck(this, ImageLoader);

        this.options = options;
        this._window = window;
        this.origin = this.getOrigin(window.location.href);
        this.cache = {};
        this.logger = logger;
        this._index = 0;
    }

    _createClass(ImageLoader, [{
        key: 'loadImage',
        value: function loadImage(src) {
            if (this.hasImageInCache(src)) {
                return src;
            }

            if (isSVG(src)) {
                if (this.options.allowTaint === true || _Feature2.default.SUPPORT_SVG_DRAWING) {
                    return this.addImage(src, src);
                }
            } else {
                if (this.options.allowTaint === true || isInlineBase64Image(src) || this.isSameOrigin(src)) {
                    return this.addImage(src, src);
                } else if (typeof this.options.proxy === 'string' && !this.isSameOrigin(src)) {
                    // TODO proxy
                }
            }
        }
    }, {
        key: 'inlineImage',
        value: function inlineImage(src) {
            if (isInlineImage(src)) {
                return Promise.resolve(src);
            }
            if (this.hasImageInCache(src)) {
                return this.cache[src];
            }
            // TODO proxy
            return this.xhrImage(src);
        }
    }, {
        key: 'xhrImage',
        value: function xhrImage(src) {
            var _this = this;

            this.cache[src] = new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status !== 200) {
                            reject('Failed to fetch image ' + src + ' with status code ' + xhr.status);
                        } else {
                            var reader = new FileReader();
                            // $FlowFixMe
                            reader.addEventListener('load', function () {
                                return resolve(reader.result);
                            }, false);
                            // $FlowFixMe
                            reader.addEventListener('error', function (e) {
                                return reject(e);
                            }, false);
                            reader.readAsDataURL(xhr.response);
                        }
                    }
                };
                xhr.responseType = 'blob';
                if (_this.options.imageTimeout) {
                    var timeout = _this.options.imageTimeout;
                    xhr.timeout = timeout;
                    xhr.ontimeout = function () {
                        return reject(__DEV__ ? 'Timed out (' + timeout + 'ms) fetching ' + src : '');
                    };
                }
                xhr.open('GET', src, true);
                xhr.send();
            });

            return this.cache[src];
        }
    }, {
        key: 'loadCanvas',
        value: function loadCanvas(node) {
            var key = String(this._index++);
            this.cache[key] = Promise.resolve(node);
            return key;
        }
    }, {
        key: 'hasImageInCache',
        value: function hasImageInCache(key) {
            return typeof this.cache[key] !== 'undefined';
        }
    }, {
        key: 'addImage',
        value: function addImage(key, src) {
            var _this2 = this;

            if (__DEV__) {
                this.logger.log('Added image ' + key.substring(0, 256));
            }

            var imageLoadHandler = function imageLoadHandler(supportsDataImages) {
                return new Promise(function (resolve, reject) {
                    var img = new Image();
                    img.onload = function () {
                        return resolve(img);
                    };
                    //ios safari 10.3 taints canvas with data urls unless crossOrigin is set to anonymous
                    if (!supportsDataImages) {
                        img.crossOrigin = 'anonymous';
                    }

                    img.onerror = reject;
                    img.src = src;
                    if (img.complete === true) {
                        // Inline XML images may fail to parse, throwing an Error later on
                        setTimeout(function () {
                            resolve(img);
                        }, 500);
                    }
                    if (_this2.options.imageTimeout) {
                        var timeout = _this2.options.imageTimeout;
                        setTimeout(function () {
                            return reject(__DEV__ ? 'Timed out (' + timeout + 'ms) fetching ' + src : '');
                        }, timeout);
                    }
                });
            };

            this.cache[key] = isInlineBase64Image(src) && !isSVG(src) ? // $FlowFixMe
            _Feature2.default.SUPPORT_BASE64_DRAWING(src).then(imageLoadHandler) : imageLoadHandler(true);
            return key;
        }
    }, {
        key: 'isSameOrigin',
        value: function isSameOrigin(url) {
            return this.getOrigin(url) === this.origin;
        }
    }, {
        key: 'getOrigin',
        value: function getOrigin(url) {
            var link = this._link || (this._link = this._window.document.createElement('a'));
            link.href = url;
            link.href = link.href; // IE9, LOL! - http://jsfiddle.net/niklasvh/2e48b/
            return link.protocol + link.hostname + link.port;
        }
    }, {
        key: 'ready',
        value: function ready() {
            var _this3 = this;

            var keys = Object.keys(this.cache);
            return Promise.all(keys.map(function (str) {
                return _this3.cache[str].catch(function (e) {
                    if (__DEV__) {
                        _this3.logger.log('Unable to load image', e);
                    }
                    return null;
                });
            })).then(function (images) {
                if (__DEV__) {
                    _this3.logger.log('Finished loading ' + images.length + ' images', images);
                }
                return new ImageStore(keys, images);
            });
        }
    }]);

    return ImageLoader;
}();

exports.default = ImageLoader;

var ImageStore = exports.ImageStore = function () {
    function ImageStore(keys, images) {
        _classCallCheck(this, ImageStore);

        this._keys = keys;
        this._images = images;
    }

    _createClass(ImageStore, [{
        key: 'get',
        value: function get(key) {
            var index = this._keys.indexOf(key);
            return index === -1 ? null : this._images[index];
        }
    }]);

    return ImageStore;
}();

var INLINE_SVG = /^data:image\/svg\+xml/i;
var INLINE_BASE64 = /^data:image\/.*;base64,/i;
var INLINE_IMG = /^data:image\/.*/i;

var isInlineImage = function isInlineImage(src) {
    return INLINE_IMG.test(src);
};
var isInlineBase64Image = function isInlineBase64Image(src) {
    return INLINE_BASE64.test(src);
};

var isSVG = function isSVG(src) {
    return src.substr(-3).toLowerCase() === 'svg' || INLINE_SVG.test(src);
};