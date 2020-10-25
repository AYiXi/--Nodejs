const axios = require('axios')
const crypto = require('crypto')
const qs = require('qs') // 使用 qs 模块做字符串转换 obj -> url 编码的参数
const xml2js = require('xml2js')
const moment = require('moment')  // 方便时间计算
const sha1 = require('sha1')
const url = require('url')
const WechatToken = require('../models/wechat_token')

// const appid = '' // 公众账号 id
// const mchid = '' // 商户号
// const notifyUrl = '' // 回调地址
// const mchKey = '' // 商户密钥

const { appid, mchid, notifyUrl, mchKey, appsecret } = require('../.wxconfig')

function getOpenId(code) {
    return axios.get(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${appsecret}&code=${code}&grant_type=authorization_code`)
        .then(result => {
            return result.data
        })
}

function getOauthUrl(redirectUrl, scope = 'snsapi_base') {
    redirectUrl = encodeURIComponent(redirectUrl)
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirectUrl}&response_type=code&scope=${scope}&state=STATE#wechat_redirect`
}

/**
 * 获取 accessToken
 */
async function getAccessToken() {
    //先验证数据库是否有 token, 如果没有则通过 api 获取
    const accessToken = await WechatToken.findOne({
        name: 'access_token'
    })

    const timeDiff = 0
    if (accessToken) {
        timeDiff = moment(Date.now()).diff(moment(accessToken.createAt), 'seconds')

        // 6000s 之内, token 还可以用
        if (timeDiff < 6000) {
            return accessToken.value
        } else {
            await WechatToken.deleteOne({
                name: 'access_token'
            })
        }
    }

    const result = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
        params: {
            grant_type: 'client_credential',
            appid,
            secret: appsecret
        }
    })

    const t = new wechatToken({
        name: 'access_token',
        value: result.data.access_token
    })

    await t.save()

    return result.data.access_token
}

/**
 * 获取 jsApi ticket
 */
async function getJsAPITicket() {
    //先验证数据库是否有 token, 如果没有则通过 api 获取
    const jsApiTicket = await WechatToken.findOne({
        name: 'jsapi_ticket'
    })

    const timeDiff = 0
    if (jsApiTicket) {
        timeDiff = moment(Date.now()).diff(moment(jsApiTicket.createAt), 'seconds')

        // 6000s 之内, token 还可以用
        if (timeDiff < 6000) {
            return jsApiTicket.value
        } else {
            await WechatToken.deleteOne({
                name: 'jsapi_ticket'
            })
        }
    }

    const accessToken = await getAccessToken()
    const result = await axios.get('https://api.weixin.qq.com/cgi-bin/ticket/getticket', {
        params: {
            access_token: accessToken,
            type: 'jsapi',
        }
    })

    const t = new wechatToken({
        name: 'jsapi_ticket',
        value: result.data.ticket
    })

    await t.save()

    return result.data.ticket
}

function fullUrl(req) {
    // return url.format({
    //     protocol: req.protocol,
    //     host: req.get('host'),
    //     pathname: req.originalUrl
    // })

    // 开启 https 和 nginx 代理之后, 无法获取真实的协议
    return `https://${req.get('host') + req.originalUrl}`
}

/**
 * jsapi 签名方法
 * @param {*} params 
 */
function signParams(params) {
    // 排序, 合并
    const sortedParams = Object.keys(params)
        .sort()
        .reduce((pre, cur) => ({ ...pre, [cur]: params[cur] }, {}))

    const signResult = sha1(qs.stringify(sortedParams, { encode: false }))

    return signResult
}

/**
 * 支付签名
 * @param {*} params 
 */
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

async function wxPay(payload, tradeType = 'NATIVE') {
    const { body, orderNo, ip, totalFee, nonceStr, openid } = payload
    const paramsNeedSign = {
        appid,
        mch_id: mchid,
        body,
        nonce_str: nonceStr,
        spbill_create_ip: ip,
        notify_url: notifyUrl,
        total_fee: totalFee,
        trade_type: tradeType,
        out_trade_no: orderNo
    }

    let strOpenId = ''
    if (openid) {
        paramsNeedSign.openid = openid
        strOpenId = `<openid>${openid}</openid>`
    }

    const sign = signPayParams(paramsNeedSign)
    const sendXml = `<xml>
    <appid>${appid}</appid>
    <body>${body}</body>
    <mch_id>${mchid}</mch_id>
    <nonce_str>${nonceStr}</nonce_str>
    <notify_url>${notifyUrl}</notify_url>
    <out_trade_no>${orderNo}</out_trade_no>
    ${strOpenId}
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


module.exports = {
    wxPay,
    signPayParams,
    getJsAPITicket,
    getAccessToken,
    fullUrl,
    signParams,
    appid,
    getOauthUrl,
    getOpenId
}

// wxPay({
//     body: 'test',
//     orderNo: 'D' + Date.now(),
//     ip: '127.0.0.1',
//     totalFee: 1,
//     nonceStr: Date.now()
// })