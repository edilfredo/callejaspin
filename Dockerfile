FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/src ./src
EXPOSE 3000
CMD ["node", "src/server.js"]

FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS production
RUN apk add --no-cache nginx
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY --from=backend-build /app/backend /app/backend
COPY nginx.conf /etc/nginx/http.d/default.conf
EXPOSE 80
CMD ["sh", "-c", "node /app/backend/src/server.js & nginx -g 'daemon off;'"]
