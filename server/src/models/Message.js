const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema({
  channel: { type: mongoose.Schema.Types.ObjectId, ref: "Channel", required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true });
messageSchema.index({ channel: 1, createdAt: -1 });
module.exports = mongoose.model("Message", messageSchema);
