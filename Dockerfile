# Imagen base de Node.js con Alpine Linux para un tamaño menor
FROM node:lts-alpine AS base

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package.json ./

# Instalar dependencias
RUN npm install --frozen-lockfile

# Etapa de construcción
FROM base AS build

# Argumentos de construcción para variables de entorno
ARG VITE_CLIENT_ID_GOOGLE
ARG VITE_BACKEND_URL
ARG VITE_MOODLE_URL
ARG VITE_MOODLE_TOKEN
ARG VITE_LOGIN_URL

# Establecer las variables de entorno para el build
ENV VITE_CLIENT_ID_GOOGLE=$VITE_CLIENT_ID_GOOGLE
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_MOODLE_URL=$VITE_MOODLE_URL
ENV VITE_MOODLE_TOKEN=$VITE_MOODLE_TOKEN
ENV VITE_LOGIN_URL=$VITE_LOGIN_URL

# Copiar el código fuente
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Etapa de producción con Nginx
FROM nginx:alpine AS production

# Copiar los archivos construidos desde la etapa de build
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Comando para ejecutar Nginx
CMD ["nginx", "-g", "daemon off;"]
