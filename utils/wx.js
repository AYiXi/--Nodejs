const axios = require('axios')
const crypto = require('crypto')
const qs = require('qs') // 使用 qs 模块做字符串转换 obj -> url 编码的参数
const xml2js = require('xml2js')

// const appid = '' // 公众账号 id
// const mchid = '' // 商户号
// const notifyUrl = '' // 回调地址
// const mchKey = '' // 商户密钥

const { appid, mchid, notifyUrl, mchKey } = require('../wxconfig')

function signPayParams(params) {
    const sortedParams = Object.keys(params)
        .sort()
        .reduce((pre, cur) => ({ ...pre, [cur]: params[cur] }, {}))

    sortedParams.key = mchKey
    const signResult = crypto
        .createHash('MD5')
        .update(qs.stringify(sortedParams, { encode: false }))
        .digest('hex')
        .toUpperCase()

    return signResult
}

async function wxPay(payload) {
    const { body, orderNo, ip, totalFee, nonceStr } = payload
    const paramsNeedSign = {
        appid,
        mch_id: mchid,
        body,
        nonce_str: nonceStr,
        spbill_create_ip: ip,
        notify_url: notifyUrl,
        total_fee: totalFee,
        trade_type: 'NATIVE',
        out_trade_no: orderNo
    }

    const sign = signPayParams(paramsNeedSign)
    const sendXml = `<xml>
    <appid>${appid}</appid>
    <body>${body}</body>
    <mch_id>${mchid}</mch_id>
    <nonce_str>${nonceStr}</nonce_str>
    <notify_url>${notifyUrl}</notify_url>
    <out_trade_no>${orderNo}</out_trade_no>
    <spbill_create_ip>${ip}</spbill_create_ip>
    <total_fee>${totalFee}</total_fee>
    <trade_type>NATIVE</trade_type>
    <sign>${sign}</sign>
 </xml>`

    const result = await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder', sendXml, {
        headers: {
            'content-type': 'application/xml'
        }
    })
    // console.log(result.data);

    return await xml2js.parseStringPromise(result.data, {
        cdata: true, // 里面包含 cdata 属性
        explicitArray: false // 是否以数组形式返回, 以对象形式而不是数组
    })
}


// wxPay({
//     body: 'test',
//     orderNo: 'D' + Date.now(),
//     ip: '127.0.0.1',
//     totalFee: 1,
//     nonceStr: Date.now()
// })