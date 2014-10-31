quiver-cms
==========

A CMS built on Angular, Firebase, Express and Node.

### Installation
Quiver-CMS relies on Node.js, NPM, Yeoman, Grunt, Bower, Firebase, Mandrill, Redis, elasticsearch, ImageMagick, TypeKit and Amazon Web Services S3.

1. [Install Node.js](http://howtonode.org/how-to-install-nodejs) if necessary. You'll get NPM as part of the new Node.js install.
2. Install Yeoman, Grunt and Bower. ```npm install -g yo bower grunt-cli```
3. Create a [Firebase account and create a Firebase app](https://www.firebase.com/). This will be your datastore.
4. Create an [AWS account, activate S3 and create an S3 bucket](http://docs.aws.amazon.com/AmazonS3/latest/gsg/SigningUpforS3.html).
5. Clone the repo. ```clone git@github.com:deltaepsilon/quiver-cms.git```
6. Navigate to the repo and install NPM and Bower dependencies. ```cd quiver-cms && npm install && bower install```
7. Install [redis](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-redis), [elasticsearch](https://www.digitalocean.com/community/tutorials/how-to-install-elasticsearch-on-an-ubuntu-vps) and [ImageMagick](https://help.ubuntu.com/community/ImageMagick).
8. Copy ```/config/default.json``` to ```/config/development.json``` and again to ```/config/production.json```.
9. ```default.json``` contains the default config which will be overridden by ```development.json``` or ```production.json``` depending on your [node environment](http://stackoverflow.com/questions/16978256/what-is-node-env-in-express). See more documentation at [node-config](https://github.com/lorenwest/node-config).

- Sign up for a [GoogleMaps API](https://developers.google.com/maps/) account if you'd like to use ```public.maps.apiKey```.
- Sign up for a [Disqus](https://disqus.com/) account to use ```public.disqus.shortname``` take advantage of Disqus comments.
- Sign up for [Amazon S3](http://aws.amazon.com/s3/) and create your first bucket to use ```public.amazon.publicBucket```. Also make sure to get [Amazon keys](http://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSGettingStartedGuide/AWSCredentials.html) and fill in the details at ```private.amazon```.
- Get your [Firebase secret](https://www.firebase.com/docs/web/guide/login/custom.html) for ```private.firebase.secret```.
- Generate some gibberish for ```private.sessionSecret```. The project does not currently use sessions... but it might.
- You'll need [Mandrill](https://www.mandrill.com/signup/) and [Instagram](http://instagram.com/developer) api keys to use those services.
- Add your VPS login details and deploy commands to ```private.server``` if you'd like to take advantage of ```grunt deploy``` for quick deploys. More on this later.

```
{
  "public": {
    "environment": "development",
    "firebase": {
      "endpoint": "https://my-firebase.firebaseio.com/quiver-cms"
    },
    "api": "https://my-site.com/api",
    "root": "https://my-site.com",
    "email": {
      "from": "TyrionLannister@westeros.com",
      "name": "Tyrion Lannister"
    },
    "imageSizes": {
      "small": 640,
      "medium": 1024,
      "large": 1440,
      "xlarge": 1920
    },
    "supportedImageTypes": ["jpg", "jpeg", "png", "gif", "tiff"],
    "supportedVideoTypes": ["mp4", "webm", "mpeg", "ogg"],
    "maps": {
      "apiKey": "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    },
    "disqus": {
      "shortname": "my-disqus-shortname"
    },
    "amazon": {
      "publicBucket": "assets.westeros.com"
    }
  },
  "private": {
    "firebase": {
      "secret": "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    },
    "sessionSecret": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "mandrill": {
      "apiKey": "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    },
    "instagram": {
      "clientId": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      "clientSecret": "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    },
    "amazon": {
      "accessKeyId": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      "secretAccessKey": "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    },
    "redis": {
      "dbIndex": 0,
      "ttl": 3600
    },
    "elasticSearch": {
      "host": "127.0.0.1",
      "port": 9200
    },
    "server": {
      "HostName": "server.my-remote-server.com",
      "Port": 22,
      "User": "admin",
      "IdentityFile": "~/.ssh/id_rsa",
      "destination": "/var/www/my-site-folder",
      "remoteCommand": "sh /var/www/my-site-folder/install"
    }
  }

}
```

10. Set up your Firebase app's security rules. These are a work in progress, and you'll want to make sure that you understand Firebase security rules well before attempting to deploy this app into the wild. These are the rules that I'm currently using. You'll probably want to swap out my email address for your own.

```
{
    "rules": {
      "quiver-cms": {
        "users": {
          "$user": {
            ".read": "$user == auth.id || auth.email == 'chris@quiver.is'",
            ".write": "$user == auth.id || auth.email == 'chris@quiver.is'",
            "notifications": {
              ".read": true,
              ".write": true
            }
          }
        },
        "admin": {
          ".read": "auth.email == 'chris@quiver.is'",
          ".write": "auth.email == 'chris@quiver.is'"
        },
        "content": {
          ".read": true,
          ".write": "auth.email == 'chris@quiver.is'"

        }
      }
    }
}
```

11. Start ```cms-server.js``` and ```content-server.js``` using either ```node``` or ```nodemon```. You'll need two terminal windows. You'll run ```nodemon cms-server.js``` in the first and ```nodemon content-server.js``` in the second.
12. Run ```grunt serve``` from the ```quiver-cms``` directory and the app should be up and running. You'll be able to access the front end at ```http://localhost:9900```.

### Deploy
Quiver-CMS is built for deploying to a VPS running linux. I recommend [DigitalOcean](https://www.digitalocean.com/?refcode=d5bfb6736f8e), particularly their "MEAN on Ubuntu" image.

Once you have a VPS up and running, you'll need to [install NGINX](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-14-04-lts)
and [install Node](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-an-ubuntu-14-04-server)
as well if you don't have it pre-installed with the "MEAN on Ubuntu" image.

Next install [forever](https://www.npmjs.org/package/forever) to daemonize ```content-server.js``` and ```cms-server.js```.

You'll also need to [configure NGINX to support multiple node processes](https://www.digitalocean.com/community/tutorials/how-to-host-multiple-node-js-applications-on-a-single-vps-with-nginx-forever-and-crontab).


Here's a sample config complete with a redirect to SSL. The SSL is not necessary, but it makes the entire operation much more secure.

```
server {
	listen 	80;
	server_name  quiver.is  *.quiver.is;
	return 301   https://quiver.is$request_uri;
}
server {
	listen 443 ssl;
	server_name quiver.is;

	keepalive_timeout   70;

  ssl_certificate      /etc/ssl/certs/quiver.crt;
  ssl_certificate_key  /etc/ssl/quiver.key;
  ssl_protocols  SSLv2 SSLv3 TLSv1;
  ssl_ciphers  HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers   on;
  ssl_session_cache   shared:SSL:10m;
  ssl_session_timeout 10m;

	#rewrite_log on;

	client_max_body_size 2M;

	location ~ ^/(app|images|lib|scripts|styles|views) {
    proxy_pass http://127.0.0.1:9801;
  }

  location ~ ^/api(/?)(.*) {
    proxy_set_header X-Real-IP  $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header Host $host;
    proxy_pass http://127.0.0.1:9801/$2;
   }

  location / {
    proxy_set_header X-Real-IP  $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header Host $host;
    proxy_pass http://127.0.0.1:9800;
  }

}


```

- [Adjust your nginx max body size](http://www.cyberciti.biz/faq/linux-unix-bsd-nginx-413-request-entity-too-large/) up to accommodate file uploads

### Known Issues

- The newest version of [Compass has a problem](http://stackoverflow.com/questions/25580933/zurb-foundation-sass-not-compiling-completely) with ```!global```, which is an important part of this project's CSS framework, [Zurb Foundation](http://foundation.zurb.com/docs/). This should get resolved at some point, but if Compass isn't compiling for you, try installing an older version of ```sass``` and ```compass```.
- If you're having trouble with TypeKit, get rid of the following lines in ```index.html```:

```
<script type="text/javascript" src="//use.typekit.net/bmk8cii.js"></script>
<script type="text/javascript">try{Typekit.load();}catch(e){}</script>
```

Then modify ```app/styles/theme/_font.scss``` so that ```$font-primary``` and ```$font-secondary``` are fonts names to which your page has access.

I've set up my TypeKit bundle to allow access for localhost and 127.0.0.1, but you'll run into issues if you attempt to load TypeKit fonts on your own domain.

### Testing

Run ```grunt test```
