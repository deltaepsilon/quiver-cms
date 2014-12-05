FROM dockerfile/ubuntu

MAINTAINER Chris Esplin <chris@quiver.is>

# Install Stuffs
RUN apt-get update

RUN apt-get install -y nodejs npm redis-server nginx

RUN ln -s /usr/bin/nodejs /usr/bin/node
RUN rm -f /etc/nginx/sites-enabled/default
RUN ln -s /src/nginx/default /etc/nginx/sites-enabled/default

# Don't daemonize NGINX to prevent container exit
RUN echo "daemon off;" >> /etc/nginx/nginx.conf

RUN npm install -g forever nodemon debug mime-db

# Copy the important bits
COPY dist /src/dist
COPY lib /src/lib
COPY cms-server.js /src/cms-server.js
COPY content-server.js /src/content-server.js
COPY newrelic.js /src/newrelic.js
COPY package.json /src/package.json

# Set the working directory
WORKDIR   /src

# Build the app
RUN npm install --production

EXPOSE 80
EXPOSE 443

CMD service redis-server start; sh /src/bin/start.sh; nginx
