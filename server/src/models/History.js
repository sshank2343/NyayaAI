const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    query:{
        type:String,
        required:true
    },
    response:{
        type:String,
        required:true
    },
    timestamp:{
        type:Date,
        default:Date.now
    }
    // Pro-Tip: If you add user login later, you would add a "userId" field here 
    // so each lawyer only sees their own search history!
});

module.exports = mongoose.model('History', historySchema);