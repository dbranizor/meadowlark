(function (exports, murmur) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var murmur__default = /*#__PURE__*/_interopDefaultLegacy(murmur);

  class Central {
    get(string) {
      console.log('dingo dingo murmur', murmur__default['default']);
      return murmur__default['default'].v3(string);
    }
  }

  exports.Central = Central;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}, murmur));
