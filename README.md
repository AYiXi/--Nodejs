# [常用 Web 支付开发讲解（支付宝支付和微信支付）](https://www.bilibili.com/video/BV1r541157Bo)

- 一个基于 Nodejs 的微信支付实现库
- 本库只实现了微信支付

## Start

- nodemon app.js [Linux]
- nodemon.cmd .\app.js [Windows]

## NPM

- npm init -y
- npm i express
- npm i axios
- npm i qs
- npm i mongoose
- npm i xml2js
- npm i -g nodemon
- npm i moment
- npm i sha1
- npm i ejs
- npm i cookie-parser

## Server

- add user web
- vim /etc/sudoers
  - web ALL=(ALL:ALL) ALL
- ssh-copy-id -i ~/.ssh/aliyun.pub web@ip
- ssh web@ip
- sudo api-get update
- sudo api-get install -y mongodb
- sudo api-get install -y nginx
- sudo api-get install -y git
- sudo api-get install -y nodejs
- sudo api-get install -y npm
- Install latest version of `nodejs`
  - sudo npm i n -g
  - sudo n latest
- sudo npm i nrm -g [switch image address]
  - nrm ls
  - nrm use taobao
- sudo npm i pm2 -g [start nodejs-proj with process]
- Git
  - New repository on Github
  - git remote add Github https://....git
  - git push -u Github master
- SSH
  - ssh-keygen
  - cat ~/.ssh/id_rsa.pub
  - add key to github [SSH and GPG keys](https://github.com/settings/keys)
- Deploy

  - mkdir www
  - cd www
  - git clone ...
  - npm i
  - node app.js [Test]
  - pm2 start app.js --name pay-app
    - [learn pm2](https://pm2.keymetrics.io/docs/tutorials/pm2-nginx-production-setup)
  - Nginx

    - cd /etc/nginx/config.d
    - sudo vim pay.conf

    ```sh
      upstream my_nodejs_upstream {
          server 127.0.0.1:3001;
          keepalive 64;
      }

      server {
          # listen 443 ssl;
          listen 80;

          server_name www.my-website.com;
          # ssl_certificate_key /etc/ssl/main.key;
          # ssl_certificate     /etc/ssl/main.crt;

          location / {
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header Host $http_host;

              proxy_http_version 1.1;
              proxy_set_header Upgrade $http_upgrade;
              proxy_set_header Connection "upgrade";

              proxy_pass http://my_nodejs_upstream/;
              proxy_redirect off;
              proxy_read_timeout 240s;
          }
      }
    ```

    - cd /etc/nginx/sites-enabled
      - sudo vim default
      - `listen 80 default_server` -> `listen 8080 default_server`
      - `listen [::]:80 default_server` -> `listen [::]:8080 default_server`
    - sudo nginx -s reload

  - [Apply for a HTTPS certificate](https://github.com/acmesh-official/acme.sh)
    - open 80 port on nginx
    - sudo nginx -s reload

## AutoDeploy

- chmod +x deploy.sh
- ./deploy.sh
