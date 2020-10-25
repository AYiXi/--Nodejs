const express = require('express')
const app = express()
const mongoose = require('mongoose')

app.use('/', express.static('./public'))

app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.get('/', (req, res) => {
    res.send('hello world')
})

app.use('/api/v1/wechats', require('./api/v1/wechats'))

app.post('/pay/notify_wx', wx)

app.listen(3003, () => {
    console.log('server is running on 3003');
})

mongoose
    .connect('mongodb://localhost:27017/cat-shop', {
        useNewUrlParser: true
    })
    .then(res => {
        console.log('数据库连接成功');
    })
    .catch(err => {
        console.log('数据库连接失败');
        console.log(err);
    })