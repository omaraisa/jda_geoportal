FROM node:22-alpine

# Declare build arguments
ARG NEXT_PUBLIC_ArcGISAPIKey

# Set the working directory
WORKDIR /jda_geoportal

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Set environment variables using build arguments
ENV NEXT_PUBLIC_ArcGISAPIKey=$NEXT_PUBLIC_ArcGISAPIKey

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]