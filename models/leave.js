const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    empId: {
      type: String,
      required: true
    },

    name: {
      type: String,
      required: true
    },

    leaveDate: {
      type: String,
      required: true
    },

    leaveType: {
      type: String,
      required: true
    },

    reason: {
      type: String,
      required: true
    },

    status: {
      type: String,
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Leave", leaveSchema);