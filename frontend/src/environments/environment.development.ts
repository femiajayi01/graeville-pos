/** `ng serve` proxies /api to http://localhost:3000 (see proxy.conf.json), so no CORS setup is needed locally. */
export const environment = {
  production: false,
  apiUrl: '/api',
};
