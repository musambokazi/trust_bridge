// Source is kept on main; these variants are Expo environments, not Git branches.
module.exports = ({ config }) => {
  const variant = process.env.APP_VARIANT || 'preview';
  if (!['preview', 'production'].includes(variant)) throw Error('Unknown APP_VARIANT');
  const projectId = process.env.EXPO_PROJECT_ID || config.extra?.eas?.projectId;
  const owner = process.env.EXPO_ACCOUNT || config.owner;
  const channel = process.env.TRUSTBRIDGE_UPDATE_CHANNEL || variant;
  return {
    ...config,
    ...(owner ? { owner } : {}),
    name: variant === 'preview' ? 'TrustBridge Preview' : 'TrustBridge',
    scheme: variant === 'preview' ? 'trustbridge-preview' : 'trustbridge',
    runtimeVersion: '1.0.1',
    android: { ...config.android, package: variant === 'preview' ? 'za.co.devpeeps.trustbridge.preview' : 'za.co.devpeeps.trustbridge' },
    extra: { ...config.extra, appVariant: variant, ...(projectId ? { eas: { projectId } } : {}) },
    updates: {
      enabled: !!projectId,
      ...(projectId ? { url: `https://u.expo.dev/${projectId}` } : {}),
      requestHeaders: { 'expo-channel-name': channel },
      checkAutomatically: 'NEVER',
      fallbackToCacheTimeout: 0,
    },
  };
};
