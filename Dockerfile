# Base image
FROM node:20

# Set working directory
WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

# Expose the port for the React dev server
EXPOSE 3000

# Start the React app
CMD ["npm", "run", "start"]