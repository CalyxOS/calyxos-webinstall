FROM node:lts
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN mkdir -p dist
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
