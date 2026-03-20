module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./src'],
        alias: {
          '@': './src',
          'stores': './src/stores',
          'screens': './src/screens',
          'components': './src/components',
          'services': './src/services',
          'helpers': './src/helpers',
          'styles': './src/styles',
          'assets': './src/assets',
          'locales': './src/locales'
        }
      }]
    ]
  };
};