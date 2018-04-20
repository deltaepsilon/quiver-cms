FROM mhart/alpine-node:8

MAINTAINER Chris Esplin <chris@quiver.is>

EXPOSE 80
EXPOSE 443

# Install Stuffs
RUN alias ll="ls -al"
RUN apk --update add redis nginx imagemagick vim python2 make g++ linux-headers
RUN wget http://download.redis.io/releases/redis-stable.tar.gz && tar xzf redis-stable.tar.gz && cd redis-stable && make && make install

RUN npm install -g forever


RUN rm -rf /etc/nginx/conf.d
RUN ln -s /src/nginx /etc/nginx/conf.d
RUN sed -i '90s/.*/include \/etc\/nginx\/conf.d\/*;/' /etc/nginx/nginx.conf

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
#COPY app /src/app
COPY dist /src/dist
RUN mkdir /run/nginx

CMD redis-server --daemonize yes; sh bin/start.sh; nginx
