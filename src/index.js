import fs from 'fs';
import url from 'url';
import _ from 'lodash';
import path from 'path';
import chunkSorter from 'html-webpack-plugin/lib/chunksorter';

export default class ManifestWebpackPlugin {
  constructor(filename) {
    this.filename = filename;
  }

  apply(compiler) {
    compiler.plugin('done', stats => {
      const jsonStats = stats.toJson();
      const files = _.chain(jsonStats.chunks)
          .filter(chunk => {
            // This chunk doesn't have a name. This script can't handled it.
            const chunkName = chunk.names[0];
            if (chunkName === undefined) {
              return false;
            }

            // Skip if the chunk should be lazy loaded
            if (!chunk.initial) {
              return false;
            }

            // Add otherwise
            return true;
          })
          .thru(chunks => chunkSorter.dependency(chunks))
          .flatMap('files')
          .filter(file => !/\.map$/.test(file))
          .map(file => url.resolve(jsonStats.publicPath, file))
          .groupBy(file => path.extname(file).substr(1))
          .merge({
            publicPath: jsonStats.publicPath,
          })
          .value();

      fs.writeFileSync(this.filename, JSON.stringify(files));
    });
  }
}
