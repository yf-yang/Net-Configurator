FROM node:8.11.1-alpine

RUN mkdir /workspace
COPY . /workspace
WORKDIR /workspace

RUN npm install --loglevel=error -g @angular/cli@7.0.2
RUN npm install --loglevel=error

CMD ng serve --host 0.0.0.0 --port 4000 --poll=500
