quiver-cms
==========

A CMS built on Angular, Firebase, Express and Node.

### Installation
Quiver-CMS relies on Node.js, NPM, Yeoman, Grunt, Bower, Firebase, Mandrill, TypeKit and Amazon Web Services S3.

1. [Install Node.js](http://howtonode.org/how-to-install-nodejs) if necessary. You'll get NPM as part of the new Node.js install.
2. Install Yeoman, Grunt and Bower. ```npm install -g yo bower grunt-cli```
3. Create a [Firebase account and create a Firebase app](https://www.firebase.com/). This will be your datastore.
4. Create an [AWS account, activate S3 and create an S3 bucket](http://docs.aws.amazon.com/AmazonS3/latest/gsg/SigningUpforS3.html).
5. Clone the repo. ```clone git@github.com:deltaepsilon/quiver-cms.git```
6. Navigate to the repo and install NPM and Bower dependencies. ```cd quiver-cms && npm install && bower install```
7. Add system enviroment variables for the Node server:

```
export NODE_ENV="development"

export MANDRILL_API_KEY="ASDFADSFADSFADSFADSFADSADSF"

export AMAZON_ACCESS_KEY_ID="ASDFADSFDFADFADSFDDA"
export AMAZON_SECRET_ACCESS_KEY="ASDFADFADADFADSFADSFADSFADSFADAD"
export AMAZON_CMS_PUBLIC_BUCKET="assets.saltlakecycles.com"

export QUIVER_CMS_FIREBASE="https://asdf.firebaseIO.com"
export QUIVER_CMS_FIREBASE_SECRET="ASDFADSFADSFADSFADSFAD"
export QUIVER_CMS_ROOT="/app"
export QUIVER_CMS_SESSION_SECRET="ASDFASDFADSFADSFADSFADSFADS"
```

- NODE_ENV: Should be "development", "test" or "production". You probably want "development".
- MANDRILL_API_KEY: [Sign up for Mandrill](https://www.mandrill.com/) and get an API key. We'll need this for sending email.
- AMAZON_ACCESS_KEY_ID/AMAZON_SECRET_ACCESS_KEY: You'll need to [get these keys from AWS](http://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSGettingStartedGuide/AWSCredentials.html).
- AMAZON_CMS_PUBLIC_BUCKET: Remember that bucket that you created in step 4? Well, this is location of your bucket.
- QUIVER_CMS_FIREBASE: This is the location of your Firebase app.
- QUIVER_CMS_FIREBASE_SECRET: Log into Firebase, navigate to your app and click the ***Secrets*** link on the bottom-left side of the screen. If you don't have a Firebase secret, generate one. This enables server access to your Firebase app.
- QUIVER_CMS_ROOT: For dev environments, this is "/app". It will likely be "/dist" for a deployed environment.
- QUIVER_CMS_SESSION_SECRET: This is gibberish. It may not even get used for the final version of the app, but for now, include some gibberish.

8. Set up your Firebase app's security rules. These are a work in progress, and you'll want to make sure that you understand Firebase security rules well before attempting to deploy this app into the wild. These are the rules that I'm currently using. You'll probably want to swap out my email address for your own.

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

9. Make a copy of ```app/env.js.dist``` and rename it to ```app/env.js```. Fill it out with your own details. The API server, ```cms-server.js``` is set up to listen on port 9800, and ```grunt serve``` launches your app on ```http://127.0.0.1:9000```. You'll probably only need to change the path to your Firebase app as well as your email details.
10. Run ```grunt serve``` from the ```quiver-cms``` directory and the app should be up and running.

### Known Issues

- The newest version of [Compass has a problem](http://stackoverflow.com/questions/25580933/zurb-foundation-sass-not-compiling-completely) with ```!global```, which is an important part of this project's CSS framework, [Zurb Foundation](http://foundation.zurb.com/docs/). This should get resolved at some point, but if Compass isn't compiling for you, try installing an older version of ```sass``` and ```compass```.
- If you're having trouble with TypeKit, get rid of the following lines in ```index.html```:

```
<script type="text/javascript" src="//use.typekit.net/bmk8cii.js"></script>
<script type="text/javascript">try{Typekit.load();}catch(e){}</script>
```

Then modify ```app/styles/theme/_font.scss``` so that ```$font-primary``` and ```$font-secondary``` are fonts names to which your page has access.

I've set up my TypeKit bundle to allow access for localhost and 127.0.0.1, but you'll run into issues if you attempt to load TypeKit fonts on your own domain.