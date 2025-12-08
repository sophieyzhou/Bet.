import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_PORT = 3001;

const getLanHost = () => {
  // Expo provides host info differently across versions; try both
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest2?.debuggerHost;

  if (!hostUri) return null;

  // hostUri typically looks like "192.168.1.5:19000" or "192.168.1.5:8081"
  return hostUri.split(':')[0];
};

const buildBaseFromLan = () => {
  const lanHost = getLanHost();
  if (!lanHost) return null;
  return `http://${lanHost}:${DEFAULT_PORT}`;
};

const normalizeBaseUrl = (value, { addApiPath } = { addApiPath: false }) => {
  if (!value) return null;
  // If already includes a scheme, trust it
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return addApiPath ? `${value.replace(/\/$/, '')}/api` : value;
  }
  // Otherwise assume it's a host:port pair
  const base = `http://${value}`;
  return addApiPath ? `${base}/api` : base;
};

export const getApiBaseUrl = () => {
  // 1) Explicit env override
  const envBase = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL, { addApiPath: false });
  if (envBase) {
    return envBase.endsWith('/api') ? envBase : `${envBase.replace(/\/$/, '')}/api`;
  }

  // 2) On native, derive LAN IP from Expo hostUri
  if (Platform.OS !== 'web') {
    const lanBase = buildBaseFromLan();
    if (lanBase) return `${lanBase}/api`;
  }

  // 3) Default to localhost (works for web or simulator)
  return `http://localhost:${DEFAULT_PORT}/api`;
};

export const getSocketBaseUrl = () => {
  // 1) Explicit env override
  const envBase = normalizeBaseUrl(process.env.EXPO_PUBLIC_SOCKET_URL);
  if (envBase) return envBase;

  // 2) On native, derive LAN IP from Expo hostUri
  if (Platform.OS !== 'web') {
    const lanBase = buildBaseFromLan();
    if (lanBase) return lanBase;
  }

  // 3) Default to localhost
  return `http://localhost:${DEFAULT_PORT}`;
};

