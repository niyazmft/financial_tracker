# Use specific node version for stability
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the frontend
RUN pnpm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "backend/server.js"]
