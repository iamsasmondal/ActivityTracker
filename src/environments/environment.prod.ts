export const environment = {
  production: true,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    key: 'YOUR_SUPABASE_ANON_KEY',
  },
  imagekit: {
    urlEndpoint: 'https://ik.imagekit.io/YOUR_IMAGEKIT_ID',
    publicKey: 'YOUR_IMAGEKIT_PUBLIC_KEY',
    authenticationEndpoint: 'http://localhost:3000/auth'
  }
};
