const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const { EnvironmentPlugin } = require('webpack');
const deps = require('./package.json').dependencies;
const { getEnvVariables } = require('./env.config');

/**
 * Micro-frontend (remote): "newsTicker"
 *
 * The host app consumes it with:
 *   remotes: { PortalMivzakim_Client: 'PortalMivzakim_Client@http://localhost:8890/remoteEntry.js' }
 * and imports:
 *   import NewsTicker from 'PortalMivzakim_Client/NewsTicker';
 */
module.exports = (env = {}, argv = {}) => {
  const environment = env.sviva || 'local';
  const isProd = argv.mode === 'production' || environment !== 'local';
  const outputPath = environment === 'local' ? 'dist' : 'build';
  const environmentVariables = getEnvVariables(environment);

  return {
    entry: './src/index.js',
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',

    output: {
      path: path.resolve(__dirname, outputPath),
      publicPath: environment === 'local' ? 'http://localhost:8890/' : 'auto',
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
                  exportLocalsConvention: 'asIs',
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
        name: 'PortalMivzakim_Client',
        filename: 'remoteEntry.js',
        exposes: {
          './NewsTicker': './src/components/NewsTicker/NewsTicker.jsx',
          './NewsTickerContainer': './src/components/NewsTickerContainer/NewsTickerContainer.jsx',
          './AllNewsPage': './src/components/AllNews/AllNewsPage.jsx',
        },
        shared: {
          react: { singleton: true, requiredVersion: deps.react },
          'react-dom': { singleton: true, requiredVersion: deps['react-dom'] },
        },
      }),
      new EnvironmentPlugin(environmentVariables),
      new HtmlWebpackPlugin({
        template: './src/index.html',
      }),
    ],

    devServer: {
      port: 8890,
      historyApiFallback: true,
      hot: true,
      headers: { 'Access-Control-Allow-Origin': '*' },
      proxy: {
        '/api': {
          target: 'http://localhost:29165',
          changeOrigin: true,
        },
      },
    },

    performance: { hints: false },
  };
};
