# Use the official Node.js 18 image.
FROM node:18-slim

# Set the working directory in the container.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory.
COPY package*.json ./

# Install dependencies.
RUN npm ci --only=production

# Copy the rest of the application's source code.
COPY . .

# The server will store its cache here. This path must match the
# destination in the [mounts] section of fly.toml.
RUN mkdir -p /usr/src/app/cache

# Expose the port the app runs on.
EXPOSE 3000

# The command to run the application.
CMD [ "node", "index.js" ]
