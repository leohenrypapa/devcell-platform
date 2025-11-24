# Frontend Dockerfile

# 1) Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json* ./ 
RUN npm install

COPY frontend/ ./

# Set backend url for built app to the docker-compose service name
ENV VITE_BACKEND_BASE_URL=http://backend:9000
RUN npm run build

# 2) Serve with nginx
FROM nginx:stable-alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Simple default nginx config
RUN rm /etc/nginx/conf.d/default.conf
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
