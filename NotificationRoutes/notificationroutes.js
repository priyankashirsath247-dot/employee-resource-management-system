const express = require("express");
const router = express.Router();

const Notification =
    require("../models/notification");

const Employee =
    require("../models/employee");

// ==========================================================
// ADMIN SEND NOTIFICATION
// ==========================================================

router.post(
    "/notifications/send",
    async (req, res) => {

        try {

            const {
                title,
                message,
                type,
                employeeId,
                createdBy
            } = req.body;

            if (!title || !message) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Title and message are required"

                });

            }

            const cleanTitle =
                String(title).trim();

            const cleanMessage =
                String(message).trim();

            const cleanType =
                String(
                    type || "general"
                ).trim();

            // ==================================================
            // SEND TO ALL EMPLOYEES
            // ==================================================

            if (
                !employeeId ||
                employeeId === "all"
            ) {

                const employees =
                    await Employee.find()
                        .select(
                            "employeeId name"
                        )
                        .lean();

                if (!employees.length) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "No employees found"

                    });

                }

                const notifications =
                    employees.map(
                        employee => ({

                            title:
                                cleanTitle,

                            message:
                                cleanMessage,

                            type:
                                cleanType,

                            recipientType:
                                "all",

                            employeeId:
                                String(
                                    employee.employeeId || ""
                                ),

                            employeeName:
                                String(
                                    employee.name || ""
                                ),

                            createdBy:
                                createdBy ||
                                "Admin",

                            isRead:
                                false

                        })
                    );

                const saved =
                    await Notification.insertMany(
                        notifications
                    );

                console.log(
                    `🔔 Notification sent to ${saved.length} employees`
                );

                return res.status(201).json({

                    success: true,

                    message:
                        `Notification sent to ${saved.length} employee(s)`,

                    count:
                        saved.length,

                    notifications:
                        saved

                });

            }

            // ==================================================
            // SEND TO ONE EMPLOYEE
            // ==================================================

            const employee =
                await Employee.findOne({

                    employeeId:
                        String(employeeId).trim()

                }).lean();

            if (!employee) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Employee not found"

                });

            }

            const notification =
                new Notification({

                    title:
                        cleanTitle,

                    message:
                        cleanMessage,

                    type:
                        cleanType,

                    recipientType:
                        "employee",

                    employeeId:
                        String(
                            employee.employeeId
                        ),

                    employeeName:
                        String(
                            employee.name || ""
                        ),

                    createdBy:
                        createdBy ||
                        "Admin",

                    isRead:
                        false

                });

            await notification.save();

            console.log(
                "🔔 Notification sent:",
                employee.employeeId,
                employee.name
            );

            return res.status(201).json({

                success: true,

                message:
                    "Notification sent successfully",

                notification:
                    notification

            });

        }
        catch (error) {

            console.error(
                "❌ Send Notification Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to send notification"

            });

        }

    }
);


// ==========================================================
// GET EMPLOYEE NOTIFICATIONS
// ==========================================================
// GET /api/notifications/EMP001
// ==========================================================

router.get(
    "/notifications/:employeeId",
    async (req, res) => {

        try {

            const employeeId =
                String(
                    req.params.employeeId || ""
                ).trim();

            if (!employeeId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Employee ID required"

                });

            }

            const employee =
                await Employee.findOne({

                    employeeId:
                        employeeId

                }).lean();

            if (!employee) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Employee not found"

                });

            }

            const notifications =
                await Notification.find({

                    employeeId:
                        employeeId

                })
                    .sort({
                        createdAt: -1
                    })
                    .lean();

            return res.json({

                success: true,

                employeeId:
                    employeeId,

                employeeName:
                    employee.name || "",

                count:
                    notifications.length,

                unreadCount:
                    notifications.filter(
                        n =>
                            !n.isRead
                    ).length,

                notifications:
                    notifications

            });

        }
        catch (error) {

            console.error(
                "❌ Get Notifications Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to load notifications"

            });

        }

    }
);


// ==========================================================
// MARK ONE NOTIFICATION AS READ
// ==========================================================

router.put(
    "/notifications/:notificationId/read",
    async (req, res) => {

        try {

            const notificationId =
                String(
                    req.params.notificationId || ""
                ).trim();

            const notification =
                await Notification.findByIdAndUpdate(

                    notificationId,

                    {
                        $set: {
                            isRead: true
                        }
                    },

                    {
                        new: true
                    }

                );

            if (!notification) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Notification not found"

                });

            }

            return res.json({

                success: true,

                message:
                    "Notification marked as read",

                notification:
                    notification

            });

        }
        catch (error) {

            console.error(
                "❌ Mark Read Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to mark notification"

            });

        }

    }
);


// ==========================================================
// MARK ALL EMPLOYEE NOTIFICATIONS AS READ
// ==========================================================

router.put(
    "/notifications/:employeeId/read-all",
    async (req, res) => {

        try {

            const employeeId =
                String(
                    req.params.employeeId || ""
                ).trim();

            if (!employeeId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Employee ID required"

                });

            }

            const result =
                await Notification.updateMany(

                    {
                        employeeId:
                            employeeId,

                        isRead:
                            false
                    },

                    {
                        $set: {
                            isRead: true
                        }
                    }

                );

            return res.json({

                success: true,

                message:
                    "All notifications marked as read",

                modifiedCount:
                    result.modifiedCount

            });

        }
        catch (error) {

            console.error(
                "❌ Mark All Read Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to mark all notifications"

            });

        }

    }
);


// ==========================================================
// DELETE NOTIFICATION
// ==========================================================

router.delete(
    "/notifications/:notificationId",
    async (req, res) => {

        try {

            const notificationId =
                String(
                    req.params.notificationId || ""
                ).trim();

            const deleted =
                await Notification.findByIdAndDelete(
                    notificationId
                );

            if (!deleted) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Notification not found"

                });

            }

            return res.json({

                success: true,

                message:
                    "Notification deleted successfully"

            });

        }
        catch (error) {

            console.error(
                "❌ Delete Notification Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to delete notification"

            });

        }

    }
);


module.exports = router;