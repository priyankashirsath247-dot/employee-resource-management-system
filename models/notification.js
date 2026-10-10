const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            enum: [
                "announcement",
                "task",
                "leave",
                "attendance",
                "payroll",
                "general"
            ],
            default: "general"
        },

        // "all" = every employee
        // employee = selected employee
        recipientType: {
            type: String,
           enum: ["all", "employee", "admin"],
            default: "all"
        },

        employeeId: {
            type: String,
            default: ""
        },

        employeeName: {
            type: String,
            default: ""
        },

        isRead: {
            type: Boolean,
            default: false
        },

        createdBy: {
            type: String,
            default: "Admin"
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.models.Notification ||
    mongoose.model(
        "Notification",
        notificationSchema
    );