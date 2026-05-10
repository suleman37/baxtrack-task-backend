import {
  DEFAULT_CORS_ORIGINS,
  DEFAULT_SERVER_PORT,
} from '../common/constants/app.constants';

export function getAppConfig() {
  return {
    corsOrigin: DEFAULT_CORS_ORIGINS,
    port: process.env.PORT || DEFAULT_SERVER_PORT,
  };
}
