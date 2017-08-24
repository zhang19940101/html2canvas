'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _NodeParser = require('./NodeParser');

var _Renderer = require('./Renderer');

var _Renderer2 = _interopRequireDefault(_Renderer);

var _ForeignObjectRenderer = require('./renderer/ForeignObjectRenderer');

var _ForeignObjectRenderer2 = _interopRequireDefault(_ForeignObjectRenderer);

var _CanvasRenderer = require('./renderer/CanvasRenderer');

var _CanvasRenderer2 = _interopRequireDefault(_CanvasRenderer);

var _Logger = require('./Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _ImageLoader = require('./ImageLoader');

var _ImageLoader2 = _interopRequireDefault(_ImageLoader);

var _Feature = require('./Feature');

var _Feature2 = _interopRequireDefault(_Feature);

var _Bounds = require('./Bounds');

var _Clone = require('./Clone');

var _Font = require('./Font');

var _Color = require('./Color');

var _Color2 = _interopRequireDefault(_Color);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var html2canvas = function html2canvas(element, config) {
    if ((typeof console === 'undefined' ? 'undefined' : _typeof(console)) === 'object' && typeof console.log === 'function') {
        console.log('html2canvas ' + __VERSION__);
    }

    var logger = new _Logger2.default();

    var ownerDocument = element.ownerDocument;
    var defaultView = ownerDocument.defaultView;

    var defaultOptions = {
        async: true,
        allowTaint: false,
        imageTimeout: 15000,
        proxy: null,
        removeContainer: true,
        scale: defaultView.devicePixelRatio || 1,
        target: new _CanvasRenderer2.default(config.canvas),
        type: null,
        backgroundColor: config.backgroundColor,
        windowWidth: defaultView.innerWidth,
        windowHeight: defaultView.innerHeight,
        offsetX: defaultView.pageXOffset,
        offsetY: defaultView.pageYOffset
    };

    var options = _extends({}, defaultOptions, config);

    var windowBounds = new _Bounds.Bounds(options.offsetX, options.offsetY, options.windowWidth, options.windowHeight);

    var bounds = options.type === 'view' ? windowBounds : (0, _Bounds.parseDocumentSize)(ownerDocument);

    // http://www.w3.org/TR/css3-background/#special-backgrounds
    var documentBackgroundColor = ownerDocument.documentElement ? new _Color2.default(getComputedStyle(ownerDocument.documentElement).backgroundColor) : _Color.TRANSPARENT;
    var backgroundColor = config.backgroundColor || (element === ownerDocument.documentElement ? documentBackgroundColor.isTransparent() ? ownerDocument.body ? new _Color2.default(getComputedStyle(ownerDocument.body).backgroundColor) : null : documentBackgroundColor : null);

    // $FlowFixMe
    var result = _Feature2.default.SUPPORT_FOREIGNOBJECT_DRAWING.then(function (supportForeignObject) {
        return supportForeignObject ? function (cloner) {
            if (__DEV__) {
                logger.log('Document cloned, using foreignObject rendering');
            }

            return cloner.imageLoader.ready().then(function () {
                var renderer = new _ForeignObjectRenderer2.default(cloner.clonedReferenceElement);
                return renderer.render({
                    bounds: bounds,
                    backgroundColor: backgroundColor,
                    logger: logger,
                    scale: options.scale
                });
            });
        }(new _Clone.DocumentCloner(element, options, logger, true)) : (0, _Clone.cloneWindow)(ownerDocument, windowBounds, element, options, logger).then(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 2),
                container = _ref2[0],
                clonedElement = _ref2[1];

            if (__DEV__) {
                logger.log('Document cloned, using computed rendering');
            }

            var imageLoader = new _ImageLoader2.default(options, logger, clonedElement.ownerDocument.defaultView);
            var stack = (0, _NodeParser.NodeParser)(clonedElement, imageLoader, logger);
            var clonedDocument = clonedElement.ownerDocument;
            var width = bounds.width;
            var height = bounds.height;

            if (backgroundColor === stack.container.style.background.backgroundColor) {
                stack.container.style.background.backgroundColor = _Color.TRANSPARENT;
            }

            return imageLoader.ready().then(function (imageStore) {
                if (options.removeContainer === true) {
                    if (container.parentNode) {
                        container.parentNode.removeChild(container);
                    } else if (__DEV__) {
                        logger.log('Cannot detach cloned iframe as it is not in the DOM anymore');
                    }
                }

                var fontMetrics = new _Font.FontMetrics(clonedDocument);
                if (__DEV__) {
                    logger.log('Starting renderer');
                }

                var renderOptions = {
                    backgroundColor: backgroundColor,
                    fontMetrics: fontMetrics,
                    imageStore: imageStore,
                    logger: logger,
                    scale: options.scale,
                    width: width,
                    height: height
                };

                if (Array.isArray(options.target)) {
                    return Promise.all(options.target.map(function (target) {
                        var renderer = new _Renderer2.default(target, renderOptions);
                        return renderer.render(stack);
                    }));
                } else {
                    var renderer = new _Renderer2.default(options.target, renderOptions);
                    return renderer.render(stack);
                }
            });
        });
    });

    if (__DEV__) {
        return result.catch(function (e) {
            logger.error(e);
            throw e;
        });
    }
    return result;
};

html2canvas.CanvasRenderer = _CanvasRenderer2.default;

module.exports = html2canvas;