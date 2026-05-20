const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      trim: true,
      lowercase: true
    },
    companyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Company", 
      required: true 
    },
    token: { 
      type: String, 
      required: true, 
      unique: true 
    },
    status: { 
      type: String, 
      enum: ["pending", "accepted", "expired"], 
      default: "pending" 
    },
    expiresAt: { 
      type: Date, 
      required: true 
    },
  },
  { timestamps: true }
);

// TTL index to automatically delete expired invitation documents
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Invitation", invitationSchema);
