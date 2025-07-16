module.exports = {
  apps: [
    {
      name: 'larkbot-main',
      script: 'src/index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // PM2 configuration
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      
      // Auto restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Source map support
      source_map_support: true,
      
      // Node.js options
      node_args: ['--max-old-space-size=1024'],
      
      // Merge logs
      merge_logs: true,
      
      // Ignore specific files/folders for watch
      ignore_watch: [
        'node_modules',
        'logs',
        'exports',
        'tmp',
        '.git'
      ],
      
      // Watch options
      watch_options: {
        followSymlinks: false,
        usePolling: false
      }
    },
    
    // Separate process for webhook handling (if needed for scaling)
    {
      name: 'larkbot-webhook',
      script: 'src/index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
        SERVICE_TYPE: 'webhook'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
        SERVICE_TYPE: 'webhook'
      },
      // This service is disabled by default
      autorestart: false,
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/webhook-error.log',
      out_file: './logs/webhook-out.log',
      log_file: './logs/webhook-combined.log',
      time: true,
      kill_timeout: 5000,
      listen_timeout: 3000,
      merge_logs: true
    },
    
    // Phase 3 real-time automation process
    {
      name: 'larkbot-phase3',
      script: 'src/phases/phase3/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      error_file: './logs/phase3-error.log',
      out_file: './logs/phase3-out.log',
      log_file: './logs/phase3-combined.log',
      time: true,
      kill_timeout: 3000,
      listen_timeout: 2000,
      merge_logs: true,
      // This process is optional
      autorestart: false
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/larkbot.git',
      path: '/var/www/larkbot',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    },
    
    staging: {
      user: 'deploy',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/larkbot.git',
      path: '/var/www/larkbot-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};