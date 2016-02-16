FROM ubuntu

MAINTAINER Chris Esplin <chris@quiver.is>

EXPOSE 80
EXPOSE 443

# Install Stuffs
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:chris-lea/node.js
RUN add-apt-repository ppa:fkrull/deadsnakes
RUN apt-get update
RUN apt-get install -y build-essential python2.7 redis-server nginx imagemagick curl
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.30.2/install.sh | bash
RUN . ~/.nvm/nvm.sh && nvm install 5.3.0 && npm install -g npm@latest && npm config set python /usr/bin/python2.7 && npm install -g forever node-gyp

RUN rm -f /etc/nginx/sites-enabled/default
RUN ln -s /src/nginx/default /etc/nginx/sites-enabled/default

# Don't daemonize NGINX to prevent container exit
RUN echo "daemon off;" >> /etc/nginx/nginx.conf

# Set the working directory
WORKDIR   /src

# Build the app
COPY package.json /src/package.json
RUN . ~/.nvm/nvm.sh && nvm install 5.3.0 && npm install --production

# Copy the important bits
COPY newrelic.js /src/newrelic.js
COPY content-server.js /src/content-server.js
COPY cms-server.js /src/cms-server.js
COPY themes /src/themes
COPY lib /src/lib
COPY app /src/app
COPY dist /src/dist

CMD service redis-server start; . ~/.nvm/nvm.sh && nvm install 5.3.0 && sh /src/bin/start.sh; nginx
