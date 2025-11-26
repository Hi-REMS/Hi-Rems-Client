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
    host: '127.0.0.1',
    port: 8080,
    compress: true,
    client: { overlay: false },
    historyApiFallback: true,
    static: { watch: { ignored: /node_modules/ } },

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  transpileDependencies: [],
};
