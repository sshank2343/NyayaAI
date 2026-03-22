const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    query:{
        type:String,
        required:true
    },
    response:{
        type:String,
        required:true
    },
    similarCases: {
        type: Array,
        default: []
    },
    timestamp:{
        type:Date,
        default:Date.now
    }
});

module.exports = mongoose.model('History', historySchema);