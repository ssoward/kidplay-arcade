module.exports = {
  apps: [
    {
      name: 'kidplay-backend',
      script: 'server.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0',
        FRONTEND_URL: 'http://3.88.41.133',
        AZURE_OPENAI_DEV_KEY: '286f8880393d45acb678e890b36f0f6b',
        AZURE_API_KEY: '286f8880393d45acb678e890b36f0f6b',
        AZURE_OPENAI_KEY: '286f8880393d45acb678e890b36f0f6b',
        AZURE_ENDPOINT: 'https://familysearch-ai-learning-and-hackathons-proxy.azure-api.net',
      }
    }
  ]
};
