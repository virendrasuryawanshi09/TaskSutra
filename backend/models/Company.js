const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
