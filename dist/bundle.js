/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 56:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ }),

/***/ 72:
/***/ ((module) => {



var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ 113:
/***/ ((module) => {



/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ }),

/***/ 314:
/***/ ((module) => {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ }),

/***/ 424:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(601);
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(314);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `// extracted by mini-css-extract-plugin
export {};`, ""]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 540:
/***/ ((module) => {



/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ }),

/***/ 601:
/***/ ((module) => {



module.exports = function (i) {
  return i[1];
};

/***/ }),

/***/ 659:
/***/ ((module) => {



var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ }),

/***/ 825:
/***/ ((module) => {



/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/nonce */
/******/ 	(() => {
/******/ 		__webpack_require__.nc = undefined;
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

;// ./user/src/script/data/local/product.js
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var productData = [{
  id: 'hobby-1-1',
  category: 'Photography',
  name: 'Canon EOS 80D',
  description: 'DSLR camera for enthusiasts',
  price: 12000000,
  imageUrl: './eos-80d.jpg',
  type: 'buy' // 'buy' or 'rent'
}, {
  id: 'hobby-1-2',
  category: 'Photography',
  name: 'Sony Alpha a6000',
  description: 'Mirrorless camera with fast autofocus',
  price: 9000000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'rent',
  rentDuration: '24 hours' // '12 hours' or '24 hours' (only if type is 'rent')
}, {
  id: 'hobby-2-1',
  category: 'Gaming',
  name: 'PlayStation 5',
  description: 'Next-gen gaming console',
  price: 8000000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'rent',
  rentDuration: '24 hours'
}, {
  id: 'hobby-2-2',
  category: 'Gaming',
  name: 'Gaming PC',
  description: 'Custom-built high-end gaming PC',
  price: 25000000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'buy'
}, {
  id: 'hobby-3-1',
  category: 'Reading',
  name: 'Kindle Paperwhite',
  description: 'E-reader with adjustable warm light',
  price: 2000000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'buy'
}, {
  id: 'hobby-3-2',
  category: 'Reading',
  name: 'Noise Cancelling Headphones',
  description: 'Headphones for distraction-free reading',
  price: 3500000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'buy'
}, {
  id: 'hobby-4-1',
  category: 'Cooking',
  name: 'KitchenAid Stand Mixer',
  description: 'Versatile stand mixer for baking',
  price: 7000000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'buy'
}, {
  id: 'hobby-4-2',
  category: 'Cooking',
  name: 'Sous Vide Immersion Circulator',
  description: 'Precision cooking device',
  price: 3000000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'rent',
  rentDuration: '24 hours'
}, {
  id: 'hobby-5-1',
  category: 'Gardening',
  name: 'Gardening Tool Set',
  description: 'Complete gardening tool set',
  price: 1000000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'rent',
  rentDuration: '12 hours'
}, {
  id: 'hobby-5-2',
  category: 'Gardening',
  name: 'Raised Garden Bed',
  description: 'Elevated garden bed',
  price: 2000000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'buy'
}, {
  id: 'hobby-6-1',
  category: 'Music',
  name: 'Acoustic Guitar',
  description: 'Beginner-friendly acoustic guitar',
  price: 1500000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'rent',
  rentDuration: '24 hours'
}, {
  id: 'hobby-6-2',
  category: 'Music',
  name: 'Headphones',
  description: 'Studio-quality headphones',
  price: 2500000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'buy'
}, {
  id: 'hobby-7-1',
  category: 'Sports',
  name: 'Basketball',
  description: 'Official size basketball',
  price: 300000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'buy'
}, {
  id: 'hobby-7-2',
  category: 'Sports',
  name: 'Tennis Racket',
  description: 'Lightweight tennis racket',
  price: 1200000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'rent',
  rentDuration: '12 hours'
}, {
  id: 'hobby-8-1',
  category: 'Drawing',
  name: 'Drawing Pencils',
  description: 'Set of drawing pencils',
  price: 200000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'buy'
}, {
  id: 'hobby-8-2',
  category: 'Drawing',
  name: 'Easel',
  description: 'Adjustable easel',
  price: 1000000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'buy'
}, {
  id: 'hobby-9-1',
  category: 'Traveling',
  name: 'Backpack',
  description: 'Travel backpack',
  price: 1000000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'buy'
}, {
  id: 'hobby-9-2',
  category: 'Traveling',
  name: 'Camera',
  description: 'Compact camera',
  price: 3000000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'rent',
  rentDuration: '24 hours'
}, {
  id: 'hobby-10-1',
  category: 'Writing',
  name: 'Laptop',
  description: 'Lightweight laptop',
  price: 8000000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'buy'
}, {
  id: 'hobby-10-2',
  category: 'Writing',
  name: 'Keyboard',
  description: 'Mechanical keyboard',
  price: 1500000,
  imageUrl: 'https://via.placeholder.com/150',
  type: 'buy'
}];
console.log(productData);
var Products = /*#__PURE__*/function () {
  function Products() {
    _classCallCheck(this, Products);
  }
  return _createClass(Products, null, [{
    key: "getAll",
    value: function getAll() {
      return productData;
    }
  }, {
    key: "getByCategory",
    value: function getByCategory(category) {
      var loweredCaseCategory = category.toLowerCase();
      return productData.filter(function (product) {
        var loweredCaseProductCategory = (product.category || '').toLowerCase();
        return loweredCaseProductCategory.includes(loweredCaseCategory);
      });
    }
  }, {
    key: "getByType",
    value: function getByType(type) {
      var loweredCaseType = type.toLowerCase();
      return productData.filter(function (product) {
        var loweredCaseProductType = (product.type || '').toLowerCase();
        return loweredCaseProductType.includes(loweredCaseType);
      });
    }
  }, {
    key: "searchProduct",
    value: function searchProduct(query) {
      var loweredCaseQuery = query.toLowerCase();
      return productData.filter(function (product) {
        var loweredCaseProductName = (product.name || '').toLowerCase();
        return loweredCaseProductName.includes(loweredCaseQuery);
      });
    }
  }, {
    key: "addProduct",
    value: function addProduct(product) {
      productData.push(product);
    }
  }]);
}();
/* harmony default export */ const local_product = (Products);
;// ./user/src/script/components/app-bar.js
function app_bar_typeof(o) { "@babel/helpers - typeof"; return app_bar_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, app_bar_typeof(o); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function app_bar_classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function app_bar_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, app_bar_toPropertyKey(o.key), o); } }
function app_bar_createClass(e, r, t) { return r && app_bar_defineProperties(e.prototype, r), t && app_bar_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function app_bar_toPropertyKey(t) { var i = app_bar_toPrimitive(t, "string"); return "symbol" == app_bar_typeof(i) ? i : i + ""; }
function app_bar_toPrimitive(t, r) { if ("object" != app_bar_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != app_bar_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == app_bar_typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _wrapNativeSuper(t) { var r = "function" == typeof Map ? new Map() : void 0; return _wrapNativeSuper = function _wrapNativeSuper(t) { if (null === t || !_isNativeFunction(t)) return t; if ("function" != typeof t) throw new TypeError("Super expression must either be null or a function"); if (void 0 !== r) { if (r.has(t)) return r.get(t); r.set(t, Wrapper); } function Wrapper() { return _construct(t, arguments, _getPrototypeOf(this).constructor); } return Wrapper.prototype = Object.create(t.prototype, { constructor: { value: Wrapper, enumerable: !1, writable: !0, configurable: !0 } }), _setPrototypeOf(Wrapper, t); }, _wrapNativeSuper(t); }
function _construct(t, e, r) { if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments); var o = [null]; o.push.apply(o, e); var p = new (t.bind.apply(t, o))(); return r && _setPrototypeOf(p, r.prototype), p; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _isNativeFunction(t) { try { return -1 !== Function.toString.call(t).indexOf("[native code]"); } catch (n) { return "function" == typeof t; } }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }

var AppBar = /*#__PURE__*/function (_HTMLElement) {
  function AppBar() {
    app_bar_classCallCheck(this, AppBar);
    return _callSuper(this, AppBar);
  }
  _inherits(AppBar, _HTMLElement);
  return app_bar_createClass(AppBar, [{
    key: "_emptyContent",
    value: function _emptyContent() {
      this.innerHTML = "";
    }
  }, {
    key: "connectedCallback",
    value: function connectedCallback() {
      this.render();
    }
  }, {
    key: "render",
    value: function render() {
      this._emptyContent();
      var categories = _toConsumableArray(new Set(local_product.getAll().map(function (product) {
        return product.category;
      })));
      this.innerHTML += "\n            <div class=\"bg-white shadow-sm py-4\">\n                <div class=\"container mx-auto px-4 flex justify-between items-center\">\n\n                    <!-- Left: Logo -->\n                    <div class=\"text-xl font-bold text-gray-800\"><img src=\"./logo.png\" class=\" mr-1 h-10 inline-block\">Pinjemin</div>\n\n                    <!-- Center: Navigation Links -->\n                    <nav class=\"hidden md:flex space-x-6\">\n                        <a href=\"/home\" class=\"font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900\">\n                            Home\n                        </a>\n                        <div class=\"relative\">\n                            <button class=\"font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900\" id=\"categoryDropdownButton\">\n                                Kategori\n                            </button>\n                            <div id=\"categoryDropdownMenu\" class=\"absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 hidden z-10\">\n                                ".concat(categories.map(function (category) {
        return "\n                                    <a href=\"/explore?category=".concat(category, "\" class=\"block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100\">").concat(category, "</a>\n                                ");
      }).join(''), "\n                            </div>\n                        </div>\n                        <a href=\"/community\" class=\"font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900\">\n                            Komunitas\n                        </a>\n                        <a href=\"/my-rentals\" class=\"font-medium rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900\">\n                            Pinjaman Saya\n                        </a>\n                    </nav>\n\n                     <!-- Right: Cart and User Avatar/Dropdown -->\n                    <div class=\"flex items-center space-x-4\">\n                        <!-- Cart Icon Placeholder -->\n                        <a href=\"/cart\" class=\"text-gray-600 hover:text-gray-900\" aria-label=\"Shopping Cart\">\n                            <svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"currentColor\" class=\"size-6\">\n                                <path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z\" />\n                            </svg>\n                        </a>\n\n                        <!-- User Avatar with Dropdown -->\n                        <div class=\"relative\">\n                            <button class=\"block rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50\" id=\"userDropdownButton\">\n                                <img class=\"w-8 h-8 rounded-full object-cover\" src=\"https://via.placeholder.com/150\" alt=\"User Avatar\">\n                            </button>\n\n                            <!-- Dropdown Menu Placeholder -->\n                            <div id=\"userDropdownMenu\" class=\"absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 hidden z-10\">\n                                <a href=\"/my-profile\" class=\"block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100\">My Profile</a>\n                                <a href=\"/settings\" class=\"block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100\">Settings</a>\n                                <div class=\"border-t border-gray-100 my-1\"></div>\n                                <a href=\"/logout\" class=\"block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100\">Sign Out</a>\n                            </div>\n                        </div>\n                    </div>\n\n                     <!-- Hamburger menu placeholder untuk layar kecil -->\n                    <div class=\"md:hidden\">\n                        <button class=\"text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200\">\n                            <svg class=\"w-6 h-6\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 6h16M4 12h16M4 18h16\"></path></svg>\n                        </button>\n                    </div>\n\n                </div>\n            </div>\n        ");
      this._setupDropdownToggle();
    }
  }, {
    key: "_setupDropdownToggle",
    value: function _setupDropdownToggle() {
      var _this = this;
      var button = this.querySelector('#userDropdownButton');
      var menu = this.querySelector('#userDropdownMenu');
      var categoryButton = this.querySelector('#categoryDropdownButton');
      var categoryMenu = this.querySelector('#categoryDropdownMenu');
      if (button && menu) {
        button.addEventListener('click', function (event) {
          event.stopPropagation();
          menu.classList.toggle('hidden');
        });
      }
      if (categoryButton && categoryMenu) {
        categoryButton.addEventListener('click', function (event) {
          event.stopPropagation();
          categoryMenu.classList.toggle('hidden');
        });
      }
      document.addEventListener('click', function (event) {
        if (_this.contains(button) && _this.contains(menu)) {
          if (!button.contains(event.target) && !menu.contains(event.target)) {
            menu.classList.add('hidden');
          }
        }
        if (_this.contains(categoryButton) && _this.contains(categoryMenu)) {
          if (!categoryButton.contains(event.target) && !categoryMenu.contains(event.target)) {
            categoryMenu.classList.add('hidden');
          }
        }
      });
      window.addEventListener('scroll', function () {
        if (menu && !menu.classList.contains('hidden')) {
          menu.classList.add('hidden');
        }
        if (categoryMenu && !categoryMenu.classList.contains('hidden')) {
          categoryMenu.classList.add('hidden');
        }
      });
    }
  }]);
}(/*#__PURE__*/_wrapNativeSuper(HTMLElement));
customElements.define("app-bar", AppBar);
;// ./user/src/script/components/all-product.js
function all_product_typeof(o) { "@babel/helpers - typeof"; return all_product_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, all_product_typeof(o); }
function all_product_classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function all_product_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, all_product_toPropertyKey(o.key), o); } }
function all_product_createClass(e, r, t) { return r && all_product_defineProperties(e.prototype, r), t && all_product_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function all_product_toPropertyKey(t) { var i = all_product_toPrimitive(t, "string"); return "symbol" == all_product_typeof(i) ? i : i + ""; }
function all_product_toPrimitive(t, r) { if ("object" != all_product_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != all_product_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function all_product_callSuper(t, o, e) { return o = all_product_getPrototypeOf(o), all_product_possibleConstructorReturn(t, all_product_isNativeReflectConstruct() ? Reflect.construct(o, e || [], all_product_getPrototypeOf(t).constructor) : o.apply(t, e)); }
function all_product_possibleConstructorReturn(t, e) { if (e && ("object" == all_product_typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return all_product_assertThisInitialized(t); }
function all_product_assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function all_product_inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && all_product_setPrototypeOf(t, e); }
function all_product_wrapNativeSuper(t) { var r = "function" == typeof Map ? new Map() : void 0; return all_product_wrapNativeSuper = function _wrapNativeSuper(t) { if (null === t || !all_product_isNativeFunction(t)) return t; if ("function" != typeof t) throw new TypeError("Super expression must either be null or a function"); if (void 0 !== r) { if (r.has(t)) return r.get(t); r.set(t, Wrapper); } function Wrapper() { return all_product_construct(t, arguments, all_product_getPrototypeOf(this).constructor); } return Wrapper.prototype = Object.create(t.prototype, { constructor: { value: Wrapper, enumerable: !1, writable: !0, configurable: !0 } }), all_product_setPrototypeOf(Wrapper, t); }, all_product_wrapNativeSuper(t); }
function all_product_construct(t, e, r) { if (all_product_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments); var o = [null]; o.push.apply(o, e); var p = new (t.bind.apply(t, o))(); return r && all_product_setPrototypeOf(p, r.prototype), p; }
function all_product_isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (all_product_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function all_product_isNativeFunction(t) { try { return -1 !== Function.toString.call(t).indexOf("[native code]"); } catch (n) { return "function" == typeof t; } }
function all_product_setPrototypeOf(t, e) { return all_product_setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, all_product_setPrototypeOf(t, e); }
function all_product_getPrototypeOf(t) { return all_product_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, all_product_getPrototypeOf(t); }

var AllProduct = /*#__PURE__*/function (_HTMLElement) {
  function AllProduct() {
    all_product_classCallCheck(this, AllProduct);
    return all_product_callSuper(this, AllProduct);
  }
  all_product_inherits(AllProduct, _HTMLElement);
  return all_product_createClass(AllProduct, [{
    key: "connectedCallback",
    value: function connectedCallback() {
      this.render();
    }
  }, {
    key: "render",
    value: function render() {
      this.innerHTML = "\n        <div class=\"bg-white\">\n            <div class=\"mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8\">\n                <h2 class=\"sr-only\">Products</h2>\n                <div class=\"grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8\">\n                    ".concat(this.generateProductList(), "\n                </div>\n            </div>\n        </div>\n        ");
    }
  }, {
    key: "generateProductList",
    value: function generateProductList() {
      var productData = local_product.getAll();
      var formatRupiah = function formatRupiah(money) {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(money);
      };
      return productData.map(function (product) {
        return "\n            <a href=\"/#/product/".concat(product.id, "\" class=\"group relative\">\n                <img src=\"").concat(product.imageUrl, "\" alt=\"").concat(product.description, "\" class=\"aspect-square w-full rounded-lg bg-gray-200 object-cover group-hover:opacity-75 xl:aspect-7/8\">\n                ").concat(product.type === 'rent' ? "<div class=\"absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md\">Disewakan</div>" : '', "\n                ").concat(product.type === 'buy' ? "<div class=\"absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md\">Dijual</div>" : '', "\n                <h3 class=\"mt-4 text-sm text-gray-700\">").concat(product.name, "</h3>\n                <p class=\"mt-1 text-lg font-medium text-gray-900\">").concat(formatRupiah(product.price), "</p>\n            </a>\n        ");
      }).join('');
    }
  }]);
}(/*#__PURE__*/all_product_wrapNativeSuper(HTMLElement));
customElements.define('all-product', AllProduct);
;// ./user/src/script/components/detail-product.js
function detail_product_typeof(o) { "@babel/helpers - typeof"; return detail_product_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, detail_product_typeof(o); }
function detail_product_classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function detail_product_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, detail_product_toPropertyKey(o.key), o); } }
function detail_product_createClass(e, r, t) { return r && detail_product_defineProperties(e.prototype, r), t && detail_product_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function detail_product_toPropertyKey(t) { var i = detail_product_toPrimitive(t, "string"); return "symbol" == detail_product_typeof(i) ? i : i + ""; }
function detail_product_toPrimitive(t, r) { if ("object" != detail_product_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != detail_product_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function detail_product_callSuper(t, o, e) { return o = detail_product_getPrototypeOf(o), detail_product_possibleConstructorReturn(t, detail_product_isNativeReflectConstruct() ? Reflect.construct(o, e || [], detail_product_getPrototypeOf(t).constructor) : o.apply(t, e)); }
function detail_product_possibleConstructorReturn(t, e) { if (e && ("object" == detail_product_typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return detail_product_assertThisInitialized(t); }
function detail_product_assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function detail_product_inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && detail_product_setPrototypeOf(t, e); }
function detail_product_wrapNativeSuper(t) { var r = "function" == typeof Map ? new Map() : void 0; return detail_product_wrapNativeSuper = function _wrapNativeSuper(t) { if (null === t || !detail_product_isNativeFunction(t)) return t; if ("function" != typeof t) throw new TypeError("Super expression must either be null or a function"); if (void 0 !== r) { if (r.has(t)) return r.get(t); r.set(t, Wrapper); } function Wrapper() { return detail_product_construct(t, arguments, detail_product_getPrototypeOf(this).constructor); } return Wrapper.prototype = Object.create(t.prototype, { constructor: { value: Wrapper, enumerable: !1, writable: !0, configurable: !0 } }), detail_product_setPrototypeOf(Wrapper, t); }, detail_product_wrapNativeSuper(t); }
function detail_product_construct(t, e, r) { if (detail_product_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments); var o = [null]; o.push.apply(o, e); var p = new (t.bind.apply(t, o))(); return r && detail_product_setPrototypeOf(p, r.prototype), p; }
function detail_product_isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (detail_product_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function detail_product_isNativeFunction(t) { try { return -1 !== Function.toString.call(t).indexOf("[native code]"); } catch (n) { return "function" == typeof t; } }
function detail_product_setPrototypeOf(t, e) { return detail_product_setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, detail_product_setPrototypeOf(t, e); }
function detail_product_getPrototypeOf(t) { return detail_product_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, detail_product_getPrototypeOf(t); }

var DetailProduct = /*#__PURE__*/function (_HTMLElement) {
  function DetailProduct() {
    detail_product_classCallCheck(this, DetailProduct);
    return detail_product_callSuper(this, DetailProduct);
  }
  detail_product_inherits(DetailProduct, _HTMLElement);
  return detail_product_createClass(DetailProduct, [{
    key: "connectedCallback",
    value: function connectedCallback() {
      this.productId = this.getAttribute('product-id');
      console.log('Detail Product ID:', this.productId);
      this.render();
    }
  }, {
    key: "render",
    value: function render() {
      var _this = this;
      var product = local_product.getAll().find(function (p) {
        return p.id === _this.productId;
      });
      console.log('Product:', product);
      if (!product) {
        this.innerHTML = '<p>Product not found</p>';
        return;
      }
      this.innerHTML = "\n        <div class=\"bg-white\">\n            <div class=\"mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-8 gap-y-16 px-4 py-24 sm:px-6 sm:py-32 lg:max-w-7xl lg:grid-cols-2 lg:px-8\">\n                <div>\n                    <h2 class=\"text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl\">".concat(product.name, "</h2>\n                    <p class=\"mt-4 text-gray-500\">").concat(product.description, "</p>\n\n                    <dl class=\"mt-16 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-y-16 lg:gap-x-8\">\n                        <div class=\"border-t border-gray-200 pt-4\">\n                            <dt class=\"font-medium text-gray-900\">Price</dt>\n                            <dd class=\"mt-2 text-sm text-gray-500\">").concat(new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(product.price), "</dd>\n                        </div>\n                        <div class=\"border-t border-gray-200 pt-4\">\n                            <dt class=\"font-medium text-gray-900\">Category</dt>\n                            <dd class=\"mt-2 text-sm text-gray-500\">").concat(product.category, "</dd>\n                        </div>\n                        <div class=\"border-t border-gray-200 pt-4\">\n                            <dt class=\"font-medium text-gray-900\">Type</dt>\n                            <dd class=\"mt-2 text-sm text-gray-500\">").concat(product.type, "</dd>\n                        </div>\n                        ").concat(product.rentDuration ? "\n                        <div class=\"border-t border-gray-200 pt-4\">\n                            <dt class=\"font-medium text-gray-900\">Rent Duration</dt>\n                            <dd class=\"mt-2 text-sm text-gray-500\">".concat(product.rentDuration, "</dd>\n                        </div>\n                        ") : '', "\n                    </dl>\n                </div>\n                <div class=\"grid grid-cols-2 grid-rows-2 gap-4 sm:gap-6 lg:gap-8\">\n                    <img src=\"").concat(product.imageUrl, "\" alt=\"").concat(product.description, "\" class=\"rounded-lg bg-gray-100\">\n                    <img src=\"").concat(product.imageUrl, "\" alt=\"").concat(product.description, "\" class=\"rounded-lg bg-gray-100\">\n                    <img src=\"").concat(product.imageUrl, "\" alt=\"").concat(product.description, "\" class=\"rounded-lg bg-gray-100\">\n                    <img src=\"").concat(product.imageUrl, "\" alt=\"").concat(product.description, "\" class=\"rounded-lg bg-gray-100\">\n                </div>\n            </div>\n        </div>\n        ");
    }
  }]);
}(/*#__PURE__*/detail_product_wrapNativeSuper(HTMLElement));
customElements.define('detail-product', DetailProduct);
;// ./user/src/script/components/search-bar.js
function search_bar_typeof(o) { "@babel/helpers - typeof"; return search_bar_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, search_bar_typeof(o); }
function search_bar_toConsumableArray(r) { return search_bar_arrayWithoutHoles(r) || search_bar_iterableToArray(r) || search_bar_unsupportedIterableToArray(r) || search_bar_nonIterableSpread(); }
function search_bar_nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function search_bar_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return search_bar_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? search_bar_arrayLikeToArray(r, a) : void 0; } }
function search_bar_iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function search_bar_arrayWithoutHoles(r) { if (Array.isArray(r)) return search_bar_arrayLikeToArray(r); }
function search_bar_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function search_bar_classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function search_bar_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, search_bar_toPropertyKey(o.key), o); } }
function search_bar_createClass(e, r, t) { return r && search_bar_defineProperties(e.prototype, r), t && search_bar_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function search_bar_toPropertyKey(t) { var i = search_bar_toPrimitive(t, "string"); return "symbol" == search_bar_typeof(i) ? i : i + ""; }
function search_bar_toPrimitive(t, r) { if ("object" != search_bar_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != search_bar_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function search_bar_callSuper(t, o, e) { return o = search_bar_getPrototypeOf(o), search_bar_possibleConstructorReturn(t, search_bar_isNativeReflectConstruct() ? Reflect.construct(o, e || [], search_bar_getPrototypeOf(t).constructor) : o.apply(t, e)); }
function search_bar_possibleConstructorReturn(t, e) { if (e && ("object" == search_bar_typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return search_bar_assertThisInitialized(t); }
function search_bar_assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function search_bar_inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && search_bar_setPrototypeOf(t, e); }
function search_bar_wrapNativeSuper(t) { var r = "function" == typeof Map ? new Map() : void 0; return search_bar_wrapNativeSuper = function _wrapNativeSuper(t) { if (null === t || !search_bar_isNativeFunction(t)) return t; if ("function" != typeof t) throw new TypeError("Super expression must either be null or a function"); if (void 0 !== r) { if (r.has(t)) return r.get(t); r.set(t, Wrapper); } function Wrapper() { return search_bar_construct(t, arguments, search_bar_getPrototypeOf(this).constructor); } return Wrapper.prototype = Object.create(t.prototype, { constructor: { value: Wrapper, enumerable: !1, writable: !0, configurable: !0 } }), search_bar_setPrototypeOf(Wrapper, t); }, search_bar_wrapNativeSuper(t); }
function search_bar_construct(t, e, r) { if (search_bar_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments); var o = [null]; o.push.apply(o, e); var p = new (t.bind.apply(t, o))(); return r && search_bar_setPrototypeOf(p, r.prototype), p; }
function search_bar_isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (search_bar_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function search_bar_isNativeFunction(t) { try { return -1 !== Function.toString.call(t).indexOf("[native code]"); } catch (n) { return "function" == typeof t; } }
function search_bar_setPrototypeOf(t, e) { return search_bar_setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, search_bar_setPrototypeOf(t, e); }
function search_bar_getPrototypeOf(t) { return search_bar_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, search_bar_getPrototypeOf(t); }

var SearchBar = /*#__PURE__*/function (_HTMLElement) {
  function SearchBar() {
    var _this;
    search_bar_classCallCheck(this, SearchBar);
    _this = search_bar_callSuper(this, SearchBar);
    _this.shadow = _this.attachShadow({
      mode: 'open'
    });
    return _this;
  }
  search_bar_inherits(SearchBar, _HTMLElement);
  return search_bar_createClass(SearchBar, [{
    key: "connectedCallback",
    value: function connectedCallback() {
      this.render();
    }
  }, {
    key: "render",
    value: function render() {
      this.shadow.innerHTML = "\n            <div class=\"relative w-full\">\n                <input type=\"text\" class=\"block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-e-lg border-s-gray-50 border-s-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-s-gray-700  dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500\" placeholder=\"Search Mockups, Logos, Design Templates...\">\n                <select class=\"p-1 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-sm\" id=\"categorySelect\">\n                    <option value=\"\">Semua Kategori</option>\n                    <!-- Opsi kategori akan ditambahkan di sini -->\n                </select>\n                <select class=\"p-1 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-sm\" id=\"priceSelect\">\n                    <option value=\"\">Semua Harga</option>\n                    <option value=\"asc\">Termurah</option>\n                    <option value=\"desc\">Termahal</option>\n                </select>\n                <select class=\"p-1 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-sm\" id=\"typeSelect\">\n                    <option value=\"\">Semua Jenis</option>\n                    <option value=\"beli\">Beli</option>\n                    <option value=\"sewa\">Sewa</option>\n                </select>\n                <button class=\"bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded-md text-sm\">Cari</button>\n            </div>\n        ";
      this.setupEventListeners();
      this.populateCategories();
      this.populateTypes();
    }
  }, {
    key: "setupEventListeners",
    value: function setupEventListeners() {
      var _this2 = this;
      var searchInput = this.shadow.querySelector('.flex-grow');
      var categorySelect = this.shadow.querySelector('#categorySelect');
      var priceSelect = this.shadow.querySelector('#priceSelect');
      var typeSelect = this.shadow.querySelector('#typeSelect');
      var searchButton = this.shadow.querySelector('.bg-blue-500');
      searchButton.addEventListener('click', function () {
        var searchTerm = searchInput.value;
        var category = categorySelect.value;
        var price = priceSelect.value;
        var type = typeSelect.value;
        _this2.dispatchEvent(new CustomEvent('search', {
          bubbles: true,
          composed: true,
          detail: {
            searchTerm: searchTerm,
            category: category,
            price: price,
            type: type
          }
        }));
      });
    }
  }, {
    key: "populateCategories",
    value: function populateCategories() {
      var _this3 = this;
      var categorySelect = this.shadow.querySelector('#categorySelect');
      var categories = search_bar_toConsumableArray(new Set(local_product.getAll().map(function (product) {
        return product.category;
      })));
      categories.forEach(function (category) {
        var option = _this3.shadow.ownerDocument.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
      });
    }
  }, {
    key: "populateTypes",
    value: function populateTypes() {
      var typeSelect = this.shadow.querySelector('#typeSelect');
      var types = search_bar_toConsumableArray(new Set(local_product.getAll().map(function (product) {
        return product.type;
      })));
      types.forEach(function (type) {
        var option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
      });
    }
  }]);
}(/*#__PURE__*/search_bar_wrapNativeSuper(HTMLElement));
customElements.define('search-bar', SearchBar);
;// ./user/src/script/components/index.js




// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js
var injectStylesIntoStyleTag = __webpack_require__(72);
var injectStylesIntoStyleTag_default = /*#__PURE__*/__webpack_require__.n(injectStylesIntoStyleTag);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/styleDomAPI.js
var styleDomAPI = __webpack_require__(825);
var styleDomAPI_default = /*#__PURE__*/__webpack_require__.n(styleDomAPI);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/insertBySelector.js
var insertBySelector = __webpack_require__(659);
var insertBySelector_default = /*#__PURE__*/__webpack_require__.n(insertBySelector);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js
var setAttributesWithoutAttributes = __webpack_require__(56);
var setAttributesWithoutAttributes_default = /*#__PURE__*/__webpack_require__.n(setAttributesWithoutAttributes);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/insertStyleElement.js
var insertStyleElement = __webpack_require__(540);
var insertStyleElement_default = /*#__PURE__*/__webpack_require__.n(insertStyleElement);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/styleTagTransform.js
var styleTagTransform = __webpack_require__(113);
var styleTagTransform_default = /*#__PURE__*/__webpack_require__.n(styleTagTransform);
// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./node_modules/postcss-loader/dist/cjs.js!./node_modules/mini-css-extract-plugin/dist/loader.js!./node_modules/css-loader/dist/cjs.js!./node_modules/postcss-loader/dist/cjs.js!./user/src/styles/style.css
var style = __webpack_require__(424);
;// ./user/src/styles/style.css

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (styleTagTransform_default());
options.setAttributes = (setAttributesWithoutAttributes_default());
options.insert = insertBySelector_default().bind(null, "head");
options.domAPI = (styleDomAPI_default());
options.insertStyleElement = (insertStyleElement_default());

var update = injectStylesIntoStyleTag_default()(style/* default */.A, options);




       /* harmony default export */ const styles_style = (style/* default */.A && style/* default */.A.locals ? style/* default */.A.locals : undefined);

;// ./user/src/app.js



var renderAllProduct = function renderAllProduct() {
  var mainContent = document.querySelector('main');
  mainContent.innerHTML = "<all-product></all-product>";
};
var renderDetailProduct = function renderDetailProduct(productId) {
  var mainContent = document.querySelector('main');
  mainContent.innerHTML = "<detail-product product-id=\"".concat(productId, "\"></detail-product>");
};
var handleRoute = function handleRoute() {
  var hash = window.location.hash;
  console.log('Hash:', hash);
  if (hash.startsWith('#/product/')) {
    var productId = hash.split('/').pop();
    console.log('Product ID:', productId);
    renderDetailProduct(productId);
  } else {
    renderAllProduct(); // Tampilkan halaman all product jika bukan detail produk
  }
};
document.addEventListener('DOMContentLoaded', function () {
  handleRoute();
});
window.addEventListener('hashchange', function () {
  handleRoute();
});
/******/ })()
;