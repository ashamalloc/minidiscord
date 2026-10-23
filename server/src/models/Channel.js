const mongoose = require("mongoose");
const channelSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, lowercase: true, minlength: 2, maxlength: 40 },
  server: { type: mongoose.Schema.Types.ObjectId, ref: "Server", required: true, index: true },
  type: { type: String, enum: ["text"], default: "text" },
}, { timestamps: true });
channelSchema.index({ server: 1, name: 1 }, { unique: true });
module.exports = mongoose.model("Channel", channelSchema);
