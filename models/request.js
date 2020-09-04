const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const requestSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        id: String,
        title: String,
        description: String,
        token: String,
        ended: Boolean
    },
    created_at: Date,
    log: {
        type: String,
    }
});

module.exports = mongoose.model("Request", requestSchema);
