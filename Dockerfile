FROM ubuntu

MAINTAINER Chris Esplin <chris@quiver.is>

EXPOSE 80
EXPOSE 443

# Install Stuffs
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:chris-lea/node.js
RUN add-apt-repository ppa:fkrull/deadsnakes
RUN apt-get update
RUN apt-get install -y build-essential python2.7 nodejs redis-server nginx imagemagick
RUN npm install -g npm@latest
RUN npm config set python /usr/bin/python2.7
RUN npm install -g forever node-gyp

RUN rm -f /etc/nginx/sites-enabled/default
RUN ln -s /src/nginx/default /etc/nginx/sites-enabled/default

# Don't daemonize NGINX to prevent container exit
RUN echo "daemon off;" >> /etc/nginx/nginx.conf

# Set the working directory
WORKDIR   /src

# Build the app
COPY package.json /src/package.json
RUN npm install --production

# Copy the important bits
COPY newrelic.js /src/newrelic.js
COPY content-server.js /src/content-server.js
COPY cms-server.js /src/cms-server.js
COPY themes /src/themes
COPY lib /src/lib
COPY app /src/app
COPY dist /src/dist

CMD service redis-server start; sh /src/bin/start.sh; nginx
