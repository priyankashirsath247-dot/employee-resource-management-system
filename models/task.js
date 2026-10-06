const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true
    },

    comment: {
        type: String,
        required: true,
        trim: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const taskSchema = new mongoose.Schema(
    {
        taskTitle: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        employeeId: {
            type: String,
            required: true
        },

        employeeName: {
            type: String,
            required: true
        },

        priority: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium"
        },

        startDate: {
            type: Date,
            required: true
        },

        dueDate: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: [
                "Assigned",
                "In Progress",
                "Completed",
                "Cancelled"
            ],
            default: "Assigned"
        },

        assignedBy: {
            type: String,
            default: "Admin"
        },

        comments: {
            type: [commentSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Task", taskSchema);