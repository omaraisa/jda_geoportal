FROM node:22-alpine

# Declare build arguments
ARG NEXT_PUBLIC_ArcGISAPIKey
ARG NEXT_PUBLIC_PORTAL_URL
ARG NEXT_PUBLIC_PORTAL_TOKEN_SERVICE_URL
ARG NEXT_PUBLIC_LOGIN_URL

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
ENV NEXT_PUBLIC_PORTAL_URL=$NEXT_PUBLIC_PORTAL_URL
ENV NEXT_PUBLIC_PORTAL_TOKEN_SERVICE_URL=$NEXT_PUBLIC_PORTAL_TOKEN_SERVICE_URL
ENV NEXT_PUBLIC_LOGIN_URL=$NEXT_PUBLIC_LOGIN_URL

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]