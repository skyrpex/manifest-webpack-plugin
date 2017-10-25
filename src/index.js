import fs from 'fs';
import url from 'url';
import path from 'path';
import {
  flow,
  filter,
  thru,
  groupBy,
  mapValues,
  flatMap,
  map,
  keyBy,
} from 'lodash/fp';
import chunkSorter from 'html-webpack-plugin/lib/chunksorter';

// Helps filtering out invalid chunks.
const filterChunk = (chunk) => {
  // If the chunk doesn't have a name, we can't handle it.
  const chunkName = chunk.names[0];
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
const isSourcemap = file => /\.map$/.test(file);

// Helps grouping the filenames by extension.
const getAssetType = file => file.match(/\.(\w+)$/)[1];

export default class ManifestWebpackPlugin {
  constructor(filename = 'manifest.json') {
    this.filename = filename;
  }

  apply(compiler) {
    compiler.plugin('done', (stats) => {
      const jsonStats = stats.toJson();

      // Keying chunks by ID will ease the chunk mapping later on.
      const chunksById = keyBy('id')(jsonStats.chunks);

      const files = flow(
        // Remove invalid chunks.
        filter(chunk => filterChunk(chunk)),
        // Sort chunks.
        thru(chunks => chunkSorter.dependency(chunks)),
        // Key chunks by entry name.
        keyBy('names'),
        // Map each chunk file.
        mapValues(flow(
          // Convert a chunk into an array of its chunk parent IDs, including itself.
          // This allows writing the JS dependencies into the JSON manifest.
          thru((chunk) => {
            let ids = [chunk.id];
            let stack = [chunk.id];
            while (stack.length > 0) {
              const currentChunk = chunksById[stack.pop()];
              ids = [...currentChunk.parents, ...ids];
              stack = [...stack, ...currentChunk.parents];
            }
            return ids;
          }),
          // Map each chunk ID into the real chunk.
          thru(map(chunkId => chunksById[chunkId])),
          // Pick the chunk files.
          flatMap('files'),
          // Remove sourcemap files.
          filter(file => !isSourcemap(file)),
          // Apply the public path.
          map(file => url.resolve(jsonStats.publicPath, file)),
          // Group by asset type.
          groupBy(file => getAssetType(file)),
        )),
      )(jsonStats.chunks);

      fs.writeFileSync(
        path.resolve(compiler.options.output.path, this.filename),
        JSON.stringify(files),
      );
    });
  }
}
