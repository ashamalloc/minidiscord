const ServerModel = require("../models/Server");
exports.isMember = async (serverId, userId) => Boolean(await ServerModel.findOne({ _id: serverId, members: userId }).select("_id").lean());
