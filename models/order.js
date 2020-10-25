const mongoose = require('mongoose')
const Scheme = mongoose.Schema

const orderScheme = new Scheme({
    order_no: {
        type: String,
        required: true
    },
    fee: {
        type: Number,
        default: 0
    },
    address: {
        type: String,
        default: ''
    },
    payed: {
        type: Boolean,
        default: false
    },
    payed_time: {
        type: Date
    }
}, {
    timestamps: true // 数据库生成时为每条记录添加时间戳
})

module.exports = mongoose.model('order', orderScheme)