const fs = require('fs');
const path = require('path');

module.exports = {
  publicPath: '/hirems/',
  lintOnSave: false,
  productionSourceMap: false,
  parallel: false,
  css: { sourceMap: false },
  configureWebpack: (config) => {
    if (process.env.NODE_ENV === 'development') {
      config.devtool = 'eval-cheap-module-source-map';
    }
    config.cache = { type: 'filesystem' };
  },
  devServer: {
    host: '0.0.0.0',
    port: 8080,
    server: {
      type: 'https',
      options: {
        key: fs.readFileSync(path.join(__dirname, '../Hi-Rems-Server/localhost-key.pem')),
        cert: fs.readFileSync(path.join(__dirname, '../Hi-Rems-Server/localhost.pem')),
      },
    },
    hot: false,
    webSocketServer: false,
    compress: true,
    client: { overlay: false },
    historyApiFallback: true,
    static: { watch: { ignored: /node_modules/ } },

    proxy: {
      '/api': {
        target: 'https://localhost:3000', 
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  transpileDependencies: [],
};