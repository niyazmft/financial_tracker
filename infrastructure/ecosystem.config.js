module.exports = {
  apps: [{
    name: "fintrack-server",
    script: "./backend/server.js",

    watch: true,
    ignore_watch: ["node_modules", "backend/logs", ".git"],
    env: {
      NODE_ENV: "development",
      HOST: "0.0.0.0"
    },
    env_production: {
      NODE_ENV: "production",
      HOST: "0.0.0.0"
    }
  }]
}
