# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

COPY . .

RUN npm install
RUN next build

# Expose the port for the React dev server
EXPOSE 3000

# Start the React app
CMD ["next", "start"]