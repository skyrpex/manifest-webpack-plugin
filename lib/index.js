'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chunksorter = require('html-webpack-plugin/lib/chunksorter');

var _chunksorter2 = _interopRequireDefault(_chunksorter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ManifestWebpackPlugin = function () {
  function ManifestWebpackPlugin(filename) {
    _classCallCheck(this, ManifestWebpackPlugin);

    this.filename = filename;
  }

  _createClass(ManifestWebpackPlugin, [{
    key: 'apply',
    value: function apply(compiler) {
      var _this = this;

      compiler.plugin('done', function (stats) {
        var jsonStats = stats.toJson();
        var files = _lodash2.default.chain(jsonStats.chunks).filter(function (chunk) {
          // This chunk doesn't have a name. This script can't handled it.
          var chunkName = chunk.names[0];
          if (chunkName === undefined) {
            return false;
          }

          // Skip if the chunk should be lazy loaded
          if (!chunk.initial) {
            return false;
          }

          // Add otherwise
          return true;
        }).thru(function (chunks) {
          return _chunksorter2.default.dependency(chunks);
        }).flatMap('files').filter(function (file) {
          return !/\.map$/.test(file);
        }).map(function (file) {
          return _url2.default.resolve(jsonStats.publicPath, file);
        }).groupBy(function (file) {
          return _path2.default.extname(file).substr(1);
        }).merge({
          publicPath: jsonStats.publicPath
        }).value();

        _fs2.default.writeFileSync(_this.filename, JSON.stringify(files));
      });
    }
  }]);

  return ManifestWebpackPlugin;
}();

exports.default = ManifestWebpackPlugin;
module.exports = exports['default'];