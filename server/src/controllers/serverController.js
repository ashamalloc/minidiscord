const crypto = require("crypto");
const Community = require("../models/Server");
const Channel = require("../models/Channel");
const Message = require("../models/Message");

exports.list = async (req, res) => {
  const servers = await Community.find({ members: req.user._id }).populate("members", "username").sort({ createdAt: 1 }).lean();
  const channels = await Channel.find({ server: { $in: servers.map((s) => s._id) } }).sort({ createdAt: 1 }).lean();
  res.json({ servers: servers.map((server) => ({ ...server, channels: channels.filter((c) => c.server.toString() === server._id.toString()) })) });
};
exports.create = async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (name.length < 2 || name.length > 50) return res.status(400).json({ message: "Server name must be 2–50 characters." });
  const community = await Community.create({ name, description: String(req.body?.description || "").trim().slice(0, 240), owner: req.user._id, members: [req.user._id], inviteCode: crypto.randomBytes(5).toString("hex") });
  const general = await Channel.create({ name: "general", server: community._id });
  res.status(201).json({ server: { ...community.toObject(), channels: [general] } });
};
exports.join = async (req, res) => {
  const inviteCode = typeof req.body?.inviteCode === "string" ? req.body.inviteCode.trim() : "";
  const community = await Community.findOne({ inviteCode });
  if (!community) return res.status(404).json({ message: "Invite code not found." });
  if (!community.members.some((id) => id.toString() === req.user._id.toString())) {
    community.members.push(req.user._id);
    await community.save();
  }
  const channels = await Channel.find({ server: community._id }).sort({ createdAt: 1 });
  res.json({ server: { ...community.toObject(), channels } });
};
exports.channels = async (req, res) => {
  const community = await Community.findOne({ _id: req.params.serverId, members: req.user._id }).select("_id");
  if (!community) return res.status(404).json({ message: "Server not found." });
  res.json({ channels: await Channel.find({ server: community._id }).sort({ createdAt: 1 }) });
};
exports.createChannel = async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim().toLowerCase().replace(/\s+/g, "-") : "";
  if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(name)) return res.status(400).json({ message: "Use 2–40 letters, numbers, or hyphens for a channel name." });
  const community = await Community.findOne({ _id: req.params.serverId, members: req.user._id });
  if (!community) return res.status(404).json({ message: "Server not found." });
  if (community.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Only the server owner can create channels for now." });
  try {
    const channel = await Channel.create({ name, server: community._id });
    res.status(201).json({ channel });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That channel already exists." });
    throw error;
  }
};
exports.messages = async (req, res) => {
  const channel = await Channel.findById(req.params.channelId);
  if (!channel) return res.status(404).json({ message: "Channel not found." });
  const community = await Community.findOne({ _id: channel.server, members: req.user._id }).select("_id");
  if (!community) return res.status(403).json({ message: "You do not have access to this channel." });
  const messages = await Message.find({ channel: channel._id }).sort({ createdAt: -1 }).limit(100).populate("sender", "username");
  res.json({ messages: messages.reverse() });
};
