const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

/**
 * Micro-frontend (remote): "newsTicker"
 *
 * The host app consumes it with:
 *   remotes: { newsTicker: 'newsTicker@http://localhost:5001/remoteEntry.js' }
 * and imports:
 *   import NewsTicker from 'newsTicker/NewsTicker';
 */
module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    entry: './src/index.js',
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',

    output: {
      path: path.resolve(__dirname, 'dist'),
      publicPath: 'auto',
      filename: isProd ? '[name].[contenthash:8].js' : '[name].js',
      assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
      clean: true,
    },

    resolve: {
      extensions: ['.js', '.jsx'],
    },

    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        // CSS Modules (*.module.css) – used as: import styles from './X.module.css'
        {
          test: /\.module\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: {
                  namedExport: false,
                  exportLocalsConvention: 'as-is',
                  localIdentName: isProd ? 'nt_[hash:base64:6]' : 'nt_[local]_[hash:base64:4]',
                },
              },
            },
          ],
        },
        // Regular CSS (fonts etc.)
        {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        // Small SVG icons are inlined, so they work in any host origin
        {
          test: /\.svg$/,
          type: 'asset/inline',
        },
        {
          test: /\.(woff2?|ttf|eot)$/,
          type: 'asset/resource',
        },
      ],
    },

    plugins: [
      new ModuleFederationPlugin({
        name: 'newsTicker',
        filename: 'remoteEntry.js',
        exposes: {
          './NewsTicker': './src/components/NewsTicker/index.js',
          './NewsTickerContainer': './src/components/NewsTicker/NewsTickerContainer.jsx',
        },
        shared: {
          react: { singleton: true, requiredVersion: deps.react },
          'react-dom': { singleton: true, requiredVersion: deps['react-dom'] },
        },
      }),
      // Reads .env → process.env.NEWS_API_URL (see .env.example)
      new Dotenv({ systemvars: true, silent: true, defaults: false }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
      }),
    ],

    devServer: {
      port: 5001,
      historyApiFallback: true,
      hot: true,
      headers: { 'Access-Control-Allow-Origin': '*' },
    },

    performance: { hints: false },
  };
};
