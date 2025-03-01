FROM node:18-alpine

WORKDIR /app

# Create package.json
COPY package.json ./

# Create server.js
COPY server.js ./

# Install dependencies
RUN npm install

# Create data directory for persistence
RUN mkdir data

EXPOSE 8765

CMD ["node", "server.js"] 