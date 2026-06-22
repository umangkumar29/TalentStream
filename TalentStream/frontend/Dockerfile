FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy application files
COPY . .

# Expose Vite default port
EXPOSE 5173

# Run the dev server and bind to all network interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
