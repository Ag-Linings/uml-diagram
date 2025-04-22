
# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm ci

# Set the API URL environment variable for the build
ARG VITE_API_URL=http://localhost:8002
ENV VITE_API_URL=${VITE_API_URL}

COPY . .

RUN npm run build

# Production stage
FROM nginx:alpine

# Install shell (sh is included by default), curl, and ping (in busybox or iputils)
RUN apk update && \
    apk add --no-cache curl iputils

# Copy the build output to replace the default nginx contents
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
