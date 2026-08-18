/**
 * Frontend environment config. The backend REST API base URL lives here so
 * services never hardcode it. Backend runs on :4000 and mounts everything
 * under /api.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:4000/api',
};
