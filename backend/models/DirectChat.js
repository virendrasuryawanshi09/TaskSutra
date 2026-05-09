const mongoose = require("mongoose");

const directChatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DirectMessage",
    },
    // Map to keep track of unread messages for each user ID
    // e.g., { "userId1": 2, "userId2": 0 }
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DirectChat", directChatSchema);
