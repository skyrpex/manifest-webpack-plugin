# Manifest Webpack plugin

## Installation

`npm install skyrpex/manifest-webpack-plugin`

## Usage

```js
// webpack.config.js
import ManifestPlugin from '@skyrpex/manifest-webpack-plugin';

export default {
  // ...
  plugins: [
    new ManifestPlugin('path/to/manifest.json'),
  ],
};
```
