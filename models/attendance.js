// ==========================================================
// ERMS - ATTENDANCE MODEL
// ==========================================================

const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        // --------------------------------------------------
        // EMPLOYEE ID
        // --------------------------------------------------
        employeeId: {
            type: String,
            required: true,
            trim: true
        },

        // --------------------------------------------------
        // EMPLOYEE NAME
        // --------------------------------------------------
        employeeName: {
            type: String,
            required: true,
            trim: true
        },

        // --------------------------------------------------
        // ATTENDANCE DATE
        // YYYY-MM-DD
        // --------------------------------------------------
        date: {
            type: String,
            required: true,
            trim: true,
            match: /^\d{4}-\d{2}-\d{2}$/
        },

        // --------------------------------------------------
        // CHECK IN
        // --------------------------------------------------
        checkInTime: {
            type: String,
            default: "00:00"
        },

        // --------------------------------------------------
        // CHECK OUT
        // --------------------------------------------------
        checkOutTime: {
            type: String,
            default: ""
        },

        // --------------------------------------------------
        // WORK HOURS
        // --------------------------------------------------
        workHours: {
            type: Number,
            default: 0,
            min: 0
        },

        // --------------------------------------------------
        // STATUS
        // --------------------------------------------------
        status: {
            type: String,
            enum: [
                "Present",
                "Absent",
                "Leave"
            ],
            default: "Present"
        },

        // --------------------------------------------------
        // DAY TYPE
        // --------------------------------------------------
        dayType: {
            type: String,
            enum: [
                "Full Day",
                "Half Day",
                "Leave",
                "Absent"
            ],
            default: "Full Day"
        },

        // --------------------------------------------------
        // PHOTO
        // --------------------------------------------------
        photo: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// ==========================================================
// IMPORTANT
// ONE EMPLOYEE = ONE ATTENDANCE RECORD PER DATE
// ==========================================================

attendanceSchema.index(
    {
        employeeId: 1,
        date: 1
    },
    {
        unique: true
    }
);

// ==========================================================
// EXPORT MODEL
// ==========================================================

module.exports =
    mongoose.models.Attendance ||
    mongoose.model(
        "Attendance",
        attendanceSchema
    );