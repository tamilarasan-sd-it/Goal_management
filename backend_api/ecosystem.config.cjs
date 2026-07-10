module.exports = {
  apps: [
    {
      name: '8010-goal-management',
      cwd: 'C:/xampp/htdocs/goal_module_new_version/backend_api',
      script: 'src/index.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 8010,
        BASE_URL: 'localhost',
        DB_USER: 'root',
        LOCALHOST_PASSWORD: '',
        LOCALHOST_DB: 'goal_management_db',
        JWT_SECRET: 'pdmrindia@gmail.com',
        HEALTH_URL: 'http://localhost:8010/api/v1',
        AUTH_USER_EMAIL: 'testingaaa@pdmrindia.com',
        AUTH_USER_PASSWORD: 'paqaaacqjaaaaaaaaaycgmaaaajezlcf',
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};