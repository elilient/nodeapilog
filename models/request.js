const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RequestSchema = new Schema({
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
    }
});

module.exports = mongoose.model("Request", RequestSchema);
