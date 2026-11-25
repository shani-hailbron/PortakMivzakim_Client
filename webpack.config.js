const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const { EnvironmentPlugin } = require('webpack');
const deps = require('./package.json').dependencies;
const { getEnvVariables } = require('./env.config');

/**
 * Dev-server proxy for a channel's RSS feed. The channels send no CORS headers
 * (Ynet even answers 403 when a foreign Origin is present), so the dev server
 * fetches the feed on the browser's behalf, without our Origin / Referer / cookies.
 */
function rssProxy(localPath, feedUrl) {
  const { origin, pathname, search } = new URL(feedUrl);
  return {
    // Exact match only. Also keep the paths so that none is the start of another
    // (e.g. not '/rss/ynet' next to '/rss/ynet-sport'), so a plain prefix rule on the server works too.
    context: (requestPath) => requestPath === localPath,
    target: origin,
    changeOrigin: true,
    secure: true,
    pathRewrite: () => `${pathname}${search}`,
    onProxyReq: (proxyReq) => {
      proxyReq.removeHeader('origin');
      proxyReq.removeHeader('referer');
      proxyReq.removeHeader('cookie');
    },
  };
}

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
      publicPath: environment === 'local' ? 'http://localhost:8899/' : 'auto',
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
        // SVG icons are imported as React components (@svgr/webpack):
        //   import { AllNewsSearchIcon } from '../../assets'; <AllNewsSearchIcon width="24" height="24" />
        {
          test: /\.svg$/,
          issuer: /\.[jt]sx?$/,
          use: [
            {
              loader: '@svgr/webpack',
              options: {
                svgoConfig: {
                  plugins: [
                    {
                      name: 'preset-default',
                      // Keep viewBox, so passing width/height scales the icon instead of cropping it.
                      params: { overrides: { removeViewBox: false } },
                    },
                    // Prefix ids with the file name, so gradients/masks of different icons never clash on one page.
                    'prefixIds',
                  ],
                },
              },
            },
          ],
        },
        {
          test: /\.(png|jpe?g|gif|webp)$/i,
          type: 'asset/resource',
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
          // Shared mivzakim feed: wrap the portal with it so all components share one request loop.
          './NewsFeedProvider': './src/context/NewsFeedContext.jsx',
        },
        shared: {
          react: { singleton: true, requiredVersion: deps.react },
          'react-dom': { singleton: true, requiredVersion: deps['react-dom'] },
        },
      }),
      new EnvironmentPlugin(environmentVariables),
      new HtmlWebpackPlugin({
        template: './src/index.html',
        // remoteEntry.js is only for the host app. Loading it on this page too puts two
        // webpack runtimes on the page and breaks HMR
        // ("Cannot set properties of undefined (setting './src/...')").
        excludeChunks: ['PortalMivzakim_Client'],
      }),
    ],

    devServer: {
      port: 8899,
      historyApiFallback: true,
      hot: true,
      headers: { 'Access-Control-Allow-Origin': '*' },
      proxy: [
        // Channel RSS feeds (see NEWS_SOURCES in env.config.js).
        rssProxy('/rss/ynet-news', 'https://www.ynet.co.il/Integration/StoryRss1854.xml'),
        rssProxy('/rss/ynet-sport', 'https://www.ynet.co.il/Integration/StoryRss3.xml'),
        rssProxy('/rss/haaretz', 'https://www.haaretz.co.il/srv/rss---feedly'),
        rssProxy('/rss/israelhayom', 'https://www.israelhayom.co.il/rss.xml'),
        {
          context: ['/api'],
          target: 'http://localhost:29165',
          changeOrigin: true,
        },
      ],
    },

    performance: { hints: false },
  };
};
