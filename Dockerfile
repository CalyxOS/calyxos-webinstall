FROM node:lts
WORKDIR /app
COPY ["package.json", "yarn.lock", "./"]
RUN yarn config set ignore-engines true
RUN yarn install
COPY . .
RUN mkdir -p dist
CMD ["yarn", "serve"]
