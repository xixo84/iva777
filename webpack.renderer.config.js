const rules = require('./webpack.rules');
const TerserPlugin = require('terser-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');

// Verifica si estás en modo producción
const isProduction = process.env.NODE_ENV === 'production';
console.log(isProduction);
rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins: [
    // Otros plugins...
    // Agrega webpack-obfuscator solo en producción
    ...(isProduction ? [new WebpackObfuscator({
      rotateStringArray: true,
    }, [])] : []),
  ],
  optimization: {
    // Agrega terser-webpack-plugin solo en producción
    minimizer: isProduction ? [
      new TerserPlugin({
        terserOptions: {
          compress: true,
          mangle: true,
        },
      }),
    ] : [],
  },
};

