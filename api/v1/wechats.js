const router = require('express').Router()
const Order = require('../../models/order')
const { wxPay } = require('../../utils/wx')

router.post('/pay', async (req, res) => {
    const order = new Order()

    order.order_no = 'D' + Date.now()
    order.fee = req.body.fee
    await order.save()

    const nonceStr = Date.now()
    const sign = await wxPay({
        body: 'test',
        orderNo: order.order_no,
        ip: '127.0.0.1',
        totalFee: order.fee * 100,
        nonceStr
    })

    if (sign.xml.return_code == 'SUCCESS' && sign.xml.result_code == 'SUCCESS') {
        res.json({
            code: 1,
            info: {
                nonceStr,
                prepay_id: sign.xml.prepay_id,
                paySign: sign.xml.sign,
                codeUrl: sign.xml.code_url,
                orderNo: order.order_no
            }
        })
    } else {
        res.json({
            code: 0,
            err: sign
        })
    }
})

module.exports = router