FROM node:18-alpine

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --silent

# Copy source
COPY . /app

ENV NODE_ENV=development

EXPOSE 3000

# Start Next.js in dev mode
CMD ["npm", "run", "dev"]
