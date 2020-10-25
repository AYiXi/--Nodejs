ssh web@ip << deploy
    cd /home/web/www/pay-app-final
    git pull
    npm i
    pm2 restart pay-app
    exit
deploy