const express = require('express')
const mongoose = require('mongoose')
const xml2js = require('xml2js')
const cookieParser = require('cookie-parser')
const { signPayParams, getJsAPITicket, signParams, appid, fullUrl, getOpenId, getOauthUrl } = require('./utils/wx')
const Order = require('./models/order')
const app = express()

app.use('/', express.static('./public'))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/api/v1/wechats', require('./api/v1/wechats'))

// 设置模板文件路径, 引擎
app.set('views', './views')
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.send('hello world')
})

app.get('/wx_pay', async (req, res) => {
    if (req.cookies.openid) {
        const nonceStr = Date.now().toString()
        const timestamp = Math.floor(Date.now() / 1000)
        const jsTicket = await getJsAPITicket()
        const signResult = signParams({
            jsapi_ticket: jsTicket,
            noncestr: nonceStr,
            timestamp,
            url: fullUrl(req)
        })

        res.render('wx_pay.ejs', {
            appid,
            timestamp,
            nonceStr,
            signResult,
            openid: req.cookies.openid
        })
    } else {
        // 重定向到微信授权页
        if (req.query.code) {
            // 此处有 code, 获取 openid
            const { openid } = await getOpenId(req.query.code)
            res.cookie('openid', openid, {
                path: '/'
            })
        } else {
            // 重定向到微信授权页
            const redirectUrl = fullUrl(req)
            res.redirect(getOauthUrl(redirectUrl))
        }
    }
})

// 支付结果通知, 微信服务器调用我们的开发服务器, 需要配置才能用
app.post('/pay/notify_wx', async (req, res) => {
    var buf = ''

    // 读取数据
    req.on('data', chunk => {
        buf += chunk
    })

    // 读完之后
    req.on('end', async () => {
        const payResult = await xml2js.parseStringPromise(buf, {
            explicitArray: false  // 不以数组形式展示
        })

        try {
            if (payResult.xml.return_code == 'SUCCESS') {
                const paramsNeedSign = {}
                for (let k in payResult.xml) {
                    if (k != 'sign') {
                        paramsNeedSign[k] = payResult.xml[k]
                    }
                }
                const sign = signPayParams(paramsNeedSign)

                // 如果签名成功
                if (sign == payResult.xml.sign) {
                    const orderNo = payResult.xml.out_trade_no
                    const order = await Order.findOne({
                        order_no: orderNo
                    })

                    if (order) {
                        order.payed = true
                        order.payed_time = Date.now()
                        await order.save()
                    }
                }
            }
            res.send(`
            <xml>
            <return_code><![CDATA[SUCCESS]]></return_code>
            <return_msg><![CDATA[OK]]></return_msg>
            </xml>`)
        } catch (err) {
            console.log(err);
        }
    })
})

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