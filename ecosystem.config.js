module.exports = {
  apps: [
    {
      name: 'chat-app',
      script: './dist/index.js',
      instances: 5,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT,
      },
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
    },
  ],
};
