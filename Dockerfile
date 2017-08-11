FROM node
RUN npm install gulp http-server -g

RUN mkdir /web
WORKDIR /web
VOLUME /web

CMD [ "http-server", "/web/", "-p80" ]
EXPOSE 80
