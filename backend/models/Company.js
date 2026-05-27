const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    domain: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      lowercase: true
    },
    settings: {
      themeColor: { type: String, default: "#1f6f78" },
      maxUsers: { type: Number, default: 50 },
    },
    isVerified: { 
      type: Boolean, 
      default: false 
    },
    verificationMethod: { 
      type: String, 
      enum: ["otp", "dns", "none"], 
      default: "none" 
    },
    verificationCode: { 
      type: String, 
      default: "" 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
