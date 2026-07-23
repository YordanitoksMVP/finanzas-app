# Usa una versión oficial de Node.js
FROM node:20

# Define el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código de tu aplicación
COPY . .

# Expone el puerto donde corre tu app (ejemplo: 3000)
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["node", "index.js"]