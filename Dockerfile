# Builds and runs the Lodd MCP server (stdio). Set LODD_API_KEY at runtime.
FROM node:20-slim
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build
ENTRYPOINT ["node", "dist/index.js"]
