module.exports = function (api) {
  const callerName = api.caller((caller) => caller?.name || '');
  const isNextBuild =
    callerName.includes('next') ||
    callerName === 'babel-loader' ||
    process.env.NEXT_RUNTIME ||
    process.env.__NEXT_PROCESSED_ENV;

  if (isNextBuild) {
    return {
      presets: ['next/babel'],
    };
  }

  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
