FROM node:10.19.0 as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# production stage
# 固定到已修复 nginx2root（CVE-2026-123007 等 5 个）的 1.30.7 稳定版；原先是浮动标签 stable-alpine，构建结果不可复现
FROM nginx:1.30.7-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]k 
