const mongoose = require("mongoose");
const serverSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  description: { type: String, trim: true, maxlength: 240, default: "" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  inviteCode: { type: String, required: true, unique: true, index: true },
}, { timestamps: true });
module.exports = mongoose.model("Server", serverSchema);
