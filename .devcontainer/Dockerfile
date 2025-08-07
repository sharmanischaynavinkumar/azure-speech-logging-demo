# Use Node.js official image
FROM mcr.microsoft.com/devcontainers/javascript-node:20-bullseye

# Set working directory
WORKDIR /workspaces

# Copy package.json and package-lock.json (if available)
COPY package.json ./

# Install dependencies
RUN npm install

# Set NODE_PATH environment variable
ENV NODE_PATH=/workspaces/node_modules

# Expose port 3000 (default for React development server)
EXPOSE 3000