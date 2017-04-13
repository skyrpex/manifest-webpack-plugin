'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _fp = require('lodash/fp');

var _chunksorter = require('html-webpack-plugin/lib/chunksorter');

var _chunksorter2 = _interopRequireDefault(_chunksorter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Helps filtering out invalid chunks.
var filterChunk = function filterChunk(chunk) {
  // If the chunk doesn't have a name, we can't handle it.
  var chunkName = chunk.names[0];
  if (chunkName === undefined) {
    return false;
  }

  // Skip if the chunk should be lazy loaded.
  if (!chunk.initial) {
    return false;
  }

  // Add otherwise.
  return true;
};

// Helps filtering out sourcemap files from the manifest.
var isSourcemap = function isSourcemap(file) {
  return (/\.map$/.test(file)
  );
};

// Helps grouping the filenames by extension.
var getAssetType = function getAssetType(file) {
  return file.match(/\.(\w+)$/)[1];
};

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

        // Keying chunks by ID will ease the chunk mapping later on.
        var chunksById = (0, _fp.keyBy)('id')(jsonStats.chunks);

        var files = (0, _fp.flow)(
        // Remove invalid chunks.
        (0, _fp.filter)(function (chunk) {
          return filterChunk(chunk);
        }),
        // Sort chunks.
        (0, _fp.thru)(function (chunks) {
          return _chunksorter2.default.dependency(chunks);
        }),
        // Key chunks by entry name.
        (0, _fp.keyBy)('names'),
        // Map each chunk file.
        (0, _fp.mapValues)((0, _fp.flow)(
        // Convert a chunk into an array of its chunk parent IDs, including itself.
        // This allows writing the JS dependencies into the JSON manifest.
        (0, _fp.thru)(function (chunk) {
          var ids = [chunk.id];
          var stack = [chunk.id];
          while (stack.length > 0) {
            var currentChunk = chunksById[stack.pop()];
            ids = [].concat(_toConsumableArray(currentChunk.parents), _toConsumableArray(ids));
            stack = [].concat(_toConsumableArray(stack), _toConsumableArray(currentChunk.parents));
          }
          return ids;
        }),
        // Map each chunk ID into the real chunk.
        (0, _fp.thru)((0, _fp.map)(function (chunkId) {
          return chunksById[chunkId];
        })),
        // Pick the chunk files.
        (0, _fp.flatMap)('files'),
        // Remove sourcemap files.
        (0, _fp.filter)(function (file) {
          return !isSourcemap(file);
        }),
        // Apply the public path.
        (0, _fp.map)(function (file) {
          return _url2.default.resolve(jsonStats.publicPath, file);
        }),
        // Group by asset type.
        (0, _fp.groupBy)(function (file) {
          return getAssetType(file);
        }))))(jsonStats.chunks);

        _fs2.default.writeFileSync(_this.filename, JSON.stringify(files));
      });
    }
  }]);

  return ManifestWebpackPlugin;
}();

exports.default = ManifestWebpackPlugin;
module.exports = exports['default'];