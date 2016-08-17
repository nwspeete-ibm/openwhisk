FROM node:slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app
RUN npm install && \
    apt-get autoremove

COPY . /usr/src/app

EXPOSE 443 4005
CMD [ "npm", "start" ]
