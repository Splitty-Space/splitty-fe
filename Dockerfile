# Base image
FROM node:20

ENV NEXT_PUBLIC_SERVER_URL=NEXT_PUBLIC_SERVER_URL

# Set working directory
WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

# Expose the port for the React dev server
EXPOSE 3000

# Start the React app
CMD ["npm", "run", "start"]