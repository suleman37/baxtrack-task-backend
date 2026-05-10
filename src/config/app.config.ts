import {
  DEFAULT_CORS_ORIGIN,
  DEFAULT_SERVER_PORT,
} from '../common/constants/app.constants';

export function getAppConfig() {
  return {
    corsOrigin: DEFAULT_CORS_ORIGIN,
    port: process.env.PORT || DEFAULT_SERVER_PORT,
  };
}
