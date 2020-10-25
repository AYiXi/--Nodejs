const mongoose = require('mongoose')
const Scheme = mongoose.Schema

const accessTokenSchema = new Scheme({
    name: {
        type: String,
        required: true
    },
    value: {
        type: String
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('wechat_access_token', accessTokenSchema)
