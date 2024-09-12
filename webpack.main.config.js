
const TerserPlugin = require('terser-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');

// Verifica si estás en modo producción
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
  entry: './src/main.js',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
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
