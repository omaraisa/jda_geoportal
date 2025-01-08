FROM node::19-alpine

COPY ../JDA_GEOPORTAL

WORKDIR /JDA_GEOPORTAL

RUN npm install

CMD ["npm run"]




docker build -t jda_geoportal:1.0 .
docker run -d -p 80:3000 jda_geoportal:1.0