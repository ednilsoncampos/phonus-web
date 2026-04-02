export const environment = {
  production: true,
  apiUrl: process.env['NG_APP_API_URL'] ?? '',
  devCredentials: null as { email: string; senha: string } | null,
};
