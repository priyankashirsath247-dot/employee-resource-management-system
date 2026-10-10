// ==========================================================
// ERMS - EMPLOYEE RESOURCE MANAGEMENT SYSTEM
// COMPLETE UPDATED SERVER.JS
// ==========================================================
// FEATURES
// ----------------------------------------------------------
// 1. Admin Login
// 2. Employee Login
// 3. Create Employee
// 4. Get All Employees
// 5. Employee Self Attendance
// 6. AUTO IN / OUT Attendance
// 7. Admin Attendance Save / Update
// 8. Strict Date-Wise Attendance
// 9. Employee-Wise Attendance
// 10. Employee + Date Attendance
// 11. Attendance Summary
// 12. Debug Attendance
// 13. Delete Attendance
// 14. MongoDB
// 15. No-Cache API
// 16. Employee Specific Tasks
// 17. Employee Task Comments
// 18. Admin Can Read Employee Comments
// 19. Admin Task Reply
// 20. Employee Can See Admin Reply
// ==========================================================

require("dotenv").config();

const dns = require("dns");

// Google DNS only for local development.
// Railway will use its default DNS configuration.
if (!process.env.RAILWAY_ENVIRONMENT) {
    dns.setServers(["8.8.8.8"]);
}

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================================
// MODELS
// ==========================================================

const Employee = require("./models/employee");
const Attendance = require("./models/attendance");

// ==========================================================
// OTHER ROUTES
// ==========================================================

const contactRoutes = require("./ContactRoutes/Contactroutes");
const leaveRoutes = require("./LeaveRoutes/leaveroutes");
const taskRoutes = require("./tasksroute/tasksroutes");
const notificationRoutes = require("./NotificationRoutes/notificationroutes");
// ==========================================================
// MIDDLEWARE
// ==========================================================

app.use(cors());

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60
        }
    })
);
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/index.html");
    }

    next();
}
// ==========================================================
// API CACHE CONTROL
// ==========================================================

app.use("/api", (req, res, next) => {

    res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    res.setHeader(
        "Pragma",
        "no-cache"
    );

    res.setHeader(
        "Expires",
        "0"
    );

    res.setHeader(
        "Surrogate-Control",
        "no-store"
    );

    next();

});

// ==========================================================
// STATIC FILES
// ==========================================================

app.use(
    express.static(
        path.join(__dirname, "View")
    )
);

app.use(
    "/img",
    express.static(
        path.join(__dirname, "img")
    )
);

// ==========================================================
// OTHER API ROUTES
// ==========================================================

app.use(
    "/api",
    contactRoutes
);

app.use(
    "/api",
    leaveRoutes
);

app.use(
    "/api",
    taskRoutes
);
app.use("/api", notificationRoutes);
// ==========================================================
// TASK MODEL
// ==========================================================

let Task;

try {

    Task = mongoose.model("Task");

} catch (error) {

    const taskSchema = new mongoose.Schema(
        {
            taskTitle: {
                type: String,
                required: true
            },

            description: {
                type: String,
                default: ""
            },

            employeeId: {
                type: String,
                required: true
            },

            employeeName: {
                type: String,
                default: ""
            },

            priority: {
                type: String,
                default: "Medium"
            },

            startDate: {
                type: String,
                default: ""
            },

            dueDate: {
                type: String,
                default: ""
            },

            status: {
                type: String,
                default: "Assigned"
            }
        },
        {
            timestamps: true
        }
    );

    Task = mongoose.model(
        "Task",
        taskSchema
    );

}

// ==========================================================
// TASK COMMENT MODEL
// ==========================================================
// Same collection handles:
//
// EMPLOYEE COMMENT
// ADMIN REPLY
//
// authorRole = employee / admin
// parentCommentId = original employee comment ID
// ==========================================================

const taskCommentSchema = new mongoose.Schema(
    {

        taskId: {
            type: String,
            required: true,
            index: true
        },

        employeeId: {
            type: String,
            required: true,
            index: true
        },

        employeeName: {
            type: String,
            default: ""
        },

        authorId: {
            type: String,
            default: ""
        },

        authorName: {
            type: String,
            default: ""
        },

        authorRole: {
            type: String,
            enum: [
                "employee",
                "admin"
            ],
            default: "employee"
        },

        comment: {
            type: String,
            required: true
        },

        // For admin reply
        parentCommentId: {
            type: String,
            default: ""
        }

    },
    {
        timestamps: true
    }
);

const TaskComment =
    mongoose.models.TaskComment ||
    mongoose.model(
        "TaskComment",
        taskCommentSchema
    );

// ==========================================================
// HELPER FUNCTIONS
// ==========================================================

// ----------------------------------------------------------
// INDIA DATE
// ----------------------------------------------------------

function getIndiaDate() {

    return new Date().toLocaleDateString(
        "en-CA",
        {
            timeZone: "Asia/Kolkata"
        }
    );

}

// ----------------------------------------------------------
// INDIA TIME
// ----------------------------------------------------------

function getIndiaTime() {

    return new Date().toLocaleTimeString(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }
    );

}

// ----------------------------------------------------------
// CONVERT TIME TO MINUTES
// ----------------------------------------------------------

function timeToMinutes(time) {

    if (!time) {
        return null;
    }

    const cleanTime =
        String(time)
            .trim()
            .toUpperCase();

    const twelveHourMatch =
        cleanTime.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
        );

    if (twelveHourMatch) {

        let hours =
            Number(
                twelveHourMatch[1]
            );

        const minutes =
            Number(
                twelveHourMatch[2]
            );

        const period =
            twelveHourMatch[3];

        if (
            hours < 1 ||
            hours > 12 ||
            minutes < 0 ||
            minutes > 59
        ) {
            return null;
        }

        if (period === "AM") {

            if (hours === 12) {
                hours = 0;
            }

        } else {

            if (hours !== 12) {
                hours += 12;
            }

        }

        return (
            hours * 60 +
            minutes
        );

    }

    const twentyFourHourMatch =
        cleanTime.match(
            /^(\d{1,2}):(\d{2})$/
        );

    if (twentyFourHourMatch) {

        const hours =
            Number(
                twentyFourHourMatch[1]
            );

        const minutes =
            Number(
                twentyFourHourMatch[2]
            );

        if (
            hours < 0 ||
            hours > 23 ||
            minutes < 0 ||
            minutes > 59
        ) {
            return null;
        }

        return (
            hours * 60 +
            minutes
        );

    }

    return null;

}

// ----------------------------------------------------------
// CALCULATE WORK HOURS
// ----------------------------------------------------------

function calculateWorkHours(
    checkInTime,
    checkOutTime
) {

    const checkIn =
        timeToMinutes(
            checkInTime
        );

    const checkOut =
        timeToMinutes(
            checkOutTime
        );

    if (
        checkIn === null ||
        checkOut === null
    ) {
        return 0;
    }

    let difference =
        checkOut -
        checkIn;

    if (difference < 0) {
        difference += 24 * 60;
    }

    return Number(
        (
            difference / 60
        ).toFixed(2)
    );

}

// ==========================================================
// TASK FINDER
// ==========================================================
// Supports MongoDB _id.
// Also supports taskId if your Task schema has taskId.
// ==========================================================

async function findTaskByIdentifier(taskIdentifier) {

    const cleanTaskId =
        String(
            taskIdentifier || ""
        ).trim();

    if (!cleanTaskId) {
        return null;
    }

    const conditions = [];

    // MongoDB _id
    if (
        mongoose.Types.ObjectId.isValid(
            cleanTaskId
        )
    ) {

        conditions.push({
            _id: cleanTaskId
        });

    }

    // Custom taskId, only if schema has it
    if (
        Task.schema &&
        Task.schema.path("taskId")
    ) {

        conditions.push({
            taskId: cleanTaskId
        });

    }

    if (conditions.length === 0) {
        return null;
    }

    return await Task.findOne({
        $or: conditions
    }).lean();

}

// ==========================================================
// HOME
// ==========================================================

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "View",
                "index.html"
            )
        );

    }
);

// ==========================================================
// ADMIN LOGIN
// ==========================================================

app.post(
    "/adminLogin",
    (req, res) => {

        try {

            const email =
                String(
                    req.body.email || ""
                )
                    .trim()
                    .toLowerCase();

            const password =
                String(
                    req.body.password || ""
                ).trim();

           if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
) {

                console.log(
                    "✅ Admin Login Successful"
                );

                return res.json({

                    success: true,

                    role: "admin",

                    message:
                        "Admin login successful"

                });

            }

            return res.status(401).json({

                success: false,

                message:
                    "Invalid Admin Login"

            });

        } catch (error) {

            console.error(
                "❌ Admin Login Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Admin login failed"

            });

        }

    }
);

// ==========================================================
// EMPLOYEE LOGIN
// ==========================================================

app.post(
    "/employeeLogin",
    async (req, res) => {

        try {

            const email =
                String(
                    req.body.email || ""
                )
                    .trim()
                    .toLowerCase();

            const password =
                String(
                    req.body.password || ""
                ).trim();

            if (!email || !password) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email and password are required"

                });

            }

            const employee =
                await Employee.findOne({
                    email: email
                }).lean();

            if (!employee) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Email not found"

                });

            }

            if (
              !(await bcrypt.compare(password, employee.password))
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Incorrect Password"

                });

            }

            const employeeId =
                String(
                    employee.employeeId || ""
                ).trim();

            if (!employeeId) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Employee ID is missing in database"

                });

            }

            console.log(
                "✅ Employee Login:",
                employee.name,
                "|",
                employeeId
            );

            return res.json({

                success: true,

                role: "employee",
employee: {

    ...employee,

    password: undefined,

    employeeId:
        employeeId

}});

 } catch (error) {

            console.error(
                "❌ Employee Login Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Employee login failed"

            });

        }

    }
);

// ==========================================================
// CREATE EMPLOYEE
// ==========================================================

app.post(
    "/api/employees",
    async (req, res) => {

        try {

            const employeeId =
                String(
                    req.body.employeeId || ""
                ).trim();

            const name =
                String(
                    req.body.name || ""
                ).trim();

            const mobile =
                String(
                    req.body.mobile || ""
                ).trim();

            const email =
                String(
                    req.body.email || ""
                )
                    .trim()
                    .toLowerCase();

            const password =
                String(
                    req.body.password || ""
                ).trim();

            const department =
                String(
                    req.body.department || ""
                ).trim();

            const position =
                String(
                    req.body.position || ""
                ).trim();

            if (
                !employeeId ||
                !name ||
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Employee ID, name, email and password are required"

                });

            }

            const existingEmployeeId =
                await Employee.findOne({
                    employeeId:
                        employeeId
                });

            if (existingEmployeeId) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Employee ID already exists"

                });

            }

            const existingEmployee =
                await Employee.findOne({
                    email:
                        email
                });

            if (existingEmployee) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Email already exists"

                });

            }

            if (mobile) {

                const existingMobile =
                    await Employee.findOne({
                        mobile:
                            mobile
                    });

                if (existingMobile) {

                    return res.status(409).json({

                        success: false,

                        message:
                            "Mobile number already exists"

                    });

                }

            }

            const employee =
                new Employee({

                    employeeId:
                        employeeId,

                    name:
                        name,

                    mobile:
                        mobile,

                    facePhoto:
                        req.body.facePhoto || "",

                    email:
                        email,

                    password:
    await bcrypt.hash(password, 10),

                    department:
                        department,

                    position:
                        position,

                    role:
                        "employee",

                    salary:
                        Number(
                            req.body.salary || 0
                        )

                });

            await employee.save();

            console.log(
                "✅ Employee Created:",
                employeeId,
                name
            );

            return res.status(201).json({

                success: true,

                message:
                    "Employee Created Successfully",

                employee:
                    employee

            });

        } catch (error) {

            console.error(
                "❌ Create Employee Error:",
                error
            );

            if (
                error.code === 11000
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Employee ID, email or mobile already exists"

                });

            }

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to create employee"

            });

        }

    }
);

// ==========================================================
// GET ALL EMPLOYEES
// ==========================================================

app.get(
    "/api/employees",
    async (req, res) => {

        try {

            const employees =
                await Employee
                    .find()
                    .sort({
                        name: 1
                    })
                    .lean();

            const cleanEmployees =
                employees.map(
                    employee => ({

                        ...employee,

                        employeeId:
                            String(
                                employee.employeeId || ""
                            ).trim(),

                        name:
                            String(
                                employee.name || ""
                            ).trim(),

                        mobile:
                            String(
                                employee.mobile || ""
                            ).trim(),

                        email:
                            String(
                                employee.email || ""
                            ).trim(),

                        department:
                            String(
                                employee.department || ""
                            ).trim(),

                        position:
                            String(
                                employee.position || ""
                            ).trim()

                    })
                );

            return res.status(200).json({

                success: true,

                count:
                    cleanEmployees.length,

                employees:
                    cleanEmployees

            });

        } catch (error) {

            console.error(
                "❌ Get Employees Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to load employees"

            });

        }

    }
);

// ==========================================================
// OLD EMPLOYEE ROUTE
// ==========================================================

app.get(
    "/employees",
    async (req, res) => {

        try {
const employees =
    await Employee
        .find()
        .select("-password")
                    .sort({
                        name: 1
                    })
                    .lean();

            return res.json(
                employees
            );

        } catch (error) {

            console.error(
                "❌ Get Employees Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to load employees"

            });

        }

    }
);

// ==========================================================
// EMPLOYEE API LOGIN
// ==========================================================

app.post(
    "/api/login",
    async (req, res) => {

        try {

            const email =
                String(
                    req.body.email || ""
                )
                    .trim()
                    .toLowerCase();

            const password =
                String(
                    req.body.password || ""
                ).trim();

            if (!email || !password) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email and password are required"

                });

            }

            const user =
                await Employee.findOne({
                    email:
                        email
                }).lean();

            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid Email or Password"

                });

            }
if (!(await bcrypt.compare(password, user.password))) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid Email or Password"

                });

            }

            const employeeId =
                String(
                    user.employeeId || ""
                ).trim();

            if (!employeeId) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Employee ID missing"

                });

            }

          return res.json({

    success: true,

    role: "employee",

    employee: {

        ...user,

        password: undefined,

        employeeId:
            employeeId

    }

});

        } catch (error) {

            console.error(
                "❌ API Login Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Login failed"

            });

        }

    }
);

// ==========================================================
// ==========================================================
// EMPLOYEE TASK APIs
// ==========================================================
// ==========================================================

// ==========================================================
// GET TASKS OF ONE EMPLOYEE
// ==========================================================

app.get(
    "/api/task/employee/:employeeId",
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

            const tasks =
                await Task.find({

                    employeeId:
                        employeeId

                })
                    .sort({
                        startDate: 1,
                        createdAt: -1
                    })
                    .lean();

            const taskIds =
                tasks.map(
                    task =>
                        String(task._id)
                );

            const comments =
                await TaskComment.find({

                    taskId: {
                        $in:
                            taskIds
                    }

                })
                    .sort({
                        createdAt: 1
                    })
                    .lean();

            const finalTasks =
                tasks.map(
                    task => {

                        const taskComments =
                            comments.filter(
                                comment =>
                                    comment.taskId ===
                                    String(task._id)
                            );

                        return {

                            ...task,

                            comments:
                                taskComments,

                            commentCount:
                                taskComments.length

                        };

                    }
                );

            console.log(
                `📋 ${employeeId} → ${finalTasks.length} task(s)`
            );

            return res.json({

                success: true,

                employeeId:
                    employeeId,

                employeeName:
                    employee.name || "",

                totalTasks:
                    finalTasks.length,

                tasks:
                    finalTasks

            });

        } catch (error) {

            console.error(
                "❌ Employee Tasks Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to load employee tasks"

            });

        }

    }
);

// ==========================================================
// GET SINGLE TASK FOR EMPLOYEE
// ==========================================================

app.get(
    "/api/task/employee/:employeeId/:taskId",
    async (req, res) => {

        try {

            const employeeId =
                String(
                    req.params.employeeId || ""
                ).trim();

            const taskId =
                String(
                    req.params.taskId || ""
                ).trim();

            if (!employeeId || !taskId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Employee ID and Task ID required"

                });

            }

            const task =
                await findTaskByIdentifier(
                    taskId
                );

            if (
                !task ||
                String(task.employeeId) !==
                employeeId
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Task not found or task is not assigned to this employee"

                });

            }

            const comments =
                await TaskComment.find({

                    taskId:
                        String(task._id)

                })
                    .sort({
                        createdAt: 1
                    })
                    .lean();

            return res.json({

                success: true,

                task: {

                    ...task,

                    comments:
                        comments,

                    commentCount:
                        comments.length

                }

            });

        } catch (error) {

            console.error(
                "❌ Single Employee Task Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to load task"

            });

        }

    }
);

// ==========================================================
// EMPLOYEE ADD COMMENT TO TASK
// ==========================================================
// POST /api/task/:taskId/comment
//
// Body:
// {
//    employeeId: "EMP001",
//    comment: "Task completed..."
// }
// ==========================================================

app.post(
    "/api/task/:taskId/comment",
    async (req, res) => {

        try {

            const taskId =
                String(
                    req.params.taskId || ""
                ).trim();

            const employeeId =
                String(
                    req.body.employeeId || ""
                ).trim();

            const comment =
                String(
                    req.body.comment || ""
                ).trim();

            if (!taskId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Task ID required"

                });

            }

            if (!employeeId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Employee ID required"

                });

            }

            if (!comment) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please write a comment"

                });

            }

            if (comment.length > 1000) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Comment cannot exceed 1000 characters"

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

            const task =
                await findTaskByIdentifier(
                    taskId
                );

            if (
                !task ||
                String(task.employeeId) !==
                employeeId
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "You can comment only on your assigned task"

                });

            }

            const newComment =
                new TaskComment({

                    taskId:
                        String(task._id),

                    employeeId:
                        employeeId,

                    employeeName:
                        employee.name || "",

                    authorId:
                        employeeId,

                    authorName:
                        employee.name || "",

                    authorRole:
                        "employee",

                    comment:
                        comment,

                    parentCommentId:
                        ""

                });

            await newComment.save();

            console.log(
                "💬 Employee Comment:",
                employeeId,
                "| Task:",
                String(task._id)
            );

            return res.status(201).json({

                success: true,

                message:
                    "Comment submitted successfully",

                comment:
                    newComment

            });

        } catch (error) {

            console.error(
                "❌ Task Comment Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to submit comment"

            });

        }

    }
);

// ==========================================================
// ADMIN GET COMMENTS OF A TASK
// ==========================================================
// GET /api/task/:taskId/comments
//
// Admin gets:
// - Employee comments
// - Admin replies
// ==========================================================

app.get(
    "/api/task/:taskId/comments",
    async (req, res) => {

        try {

            const taskId =
                String(
                    req.params.taskId || ""
                ).trim();

            if (!taskId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Task ID required"

                });

            }

            const task =
                await findTaskByIdentifier(
                    taskId
                );

            if (!task) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Task not found"

                });

            }

            const canonicalTaskId =
                String(task._id);

            const comments =
                await TaskComment.find({

                    taskId:
                        canonicalTaskId

                })
                    .sort({
                        createdAt: 1
                    })
                    .lean();

            return res.json({

                success: true,

                taskId:
                    canonicalTaskId,

                requestedTaskId:
                    taskId,

                task: {

                    _id:
                        task._id,

                    taskTitle:
                        task.taskTitle || "",

                    description:
                        task.description || "",

                    employeeId:
                        task.employeeId || "",

                    employeeName:
                        task.employeeName || "",

                    priority:
                        task.priority || "Medium",

                    startDate:
                        task.startDate || "",

                    dueDate:
                        task.dueDate || "",

                    status:
                        task.status || "Assigned"

                },

                count:
                    comments.length,

                comments:
                    comments

            });

        } catch (error) {

            console.error(
                "❌ Get Task Comments Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to load task comments"

            });

        }

    }
);

// ==========================================================
// ADMIN REPLY TO EMPLOYEE COMMENT
// ==========================================================
// POST /api/task/:taskId/reply
//
// Body:
// {
//    commentId: "COMMENT_ID",
//    reply: "Please complete it by today."
// }
//
// Admin reply is saved in same TaskComment collection.
// ==========================================================

app.post(
    "/api/task/:taskId/reply",
    async (req, res) => {

        try {

            const taskId =
                String(
                    req.params.taskId || ""
                ).trim();

            const commentId =
                String(
                    req.body.commentId || ""
                ).trim();

            const reply =
                String(
                    req.body.reply || ""
                ).trim();

            const adminName =
                String(
                    req.body.adminName ||
                    "Admin"
                ).trim();

            if (!taskId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Task ID required"

                });

            }

            if (!commentId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Comment ID required"

                });

            }

            if (!reply) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please write a reply"

                });

            }

            if (reply.length > 1000) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Reply cannot exceed 1000 characters"

                });

            }

            const task =
                await findTaskByIdentifier(
                    taskId
                );

            if (!task) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Task not found"

                });

            }

            const originalComment =
                await TaskComment.findOne({

                    _id:
                        commentId,

                    taskId:
                        String(task._id),

                    authorRole:
                        "employee"

                }).lean();

            if (!originalComment) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Employee comment not found"

                });

            }

            const adminReply =
                new TaskComment({

                    taskId:
                        String(task._id),

                    employeeId:
                        String(
                            task.employeeId || ""
                        ),

                    employeeName:
                        String(
                            task.employeeName || ""
                        ),

                    authorId:
                        "ADMIN",

                    authorName:
                        adminName || "Admin",

                    authorRole:
                        "admin",

                    comment:
                        reply,

                    parentCommentId:
                        String(
                            originalComment._id
                        )

                });

            await adminReply.save();

            console.log(
                "↩️ Admin Reply:",
                "| Task:",
                String(task._id),
                "| Employee:",
                task.employeeId
            );

            return res.status(201).json({

                success: true,

                message:
                    "Admin reply submitted successfully",

                reply:
                    adminReply

            });

        } catch (error) {

            console.error(
                "❌ Admin Reply Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to submit admin reply"

            });

        }

    }
);

// ==========================================================
// ADMIN GET SINGLE COMMENT + REPLIES
// ==========================================================
// GET /api/task/comment/:commentId/replies
// ==========================================================

app.get(
    "/api/task/comment/:commentId/replies",
    async (req, res) => {

        try {

            const commentId =
                String(
                    req.params.commentId || ""
                ).trim();

            if (!commentId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Comment ID required"

                });

            }

            if (
                !mongoose.Types.ObjectId.isValid(
                    commentId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid comment ID"

                });

            }

            const originalComment =
                await TaskComment.findById(
                    commentId
                ).lean();

            if (!originalComment) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Comment not found"

                });

            }

            const replies =
                await TaskComment.find({

                    parentCommentId:
                        commentId

                })
                    .sort({
                        createdAt: 1
                    })
                    .lean();

            return res.json({

                success: true,

                comment:
                    originalComment,

                replies:
                    replies,

                count:
                    replies.length

            });

        } catch (error) {

            console.error(
                "❌ Get Comment Replies Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to load replies"

            });

        }

    }
);

// ==========================================================
// ==========================================================
// EMPLOYEE SELF ATTENDANCE
// ==========================================================
// ==========================================================
// EMPLOYEE API LOGIN
app.post(
    "/api/login",
    async (req, res) => {

        try {

            const email =
                String(req.body.email || "")
                    .trim()
                    .toLowerCase();

            const password =
                String(req.body.password || "")
                    .trim();

            if (!email || !password) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email and password are required"

                });

            }

            const user =
                await Employee
                    .findOne({
                        email: email
                    })
                    .lean();

            // Employee does not exist
            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid Email or Password"

                });

            }

            // Check password
            if (
                !(await bcrypt.compare(
                    password,
                    user.password
                ))
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid Email or Password"

                });

            }

            const employeeId =
                String(
                    user.employeeId || ""
                ).trim();

            if (!employeeId) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Employee ID missing"

                });

            }

            // ==========================================
            // CREATE EMPLOYEE SERVER SESSION
            // ==========================================

            req.session.employeeId =
                employeeId;

            req.session.employeeName =
                String(
                    user.name || ""
                ).trim();

            req.session.role =
                "employee";

            console.log(
                "🔐 Employee session created:",
                employeeId
            );

            // ==========================================
            // SEND LOGIN RESPONSE
            // ==========================================

            return res.json({

                success: true,

                role: "employee",

                employee: {

                    ...user,

                    password:
                        undefined,

                    employeeId:
                        employeeId

                }

            });

        } catch (error) {

            console.error(
                "❌ API Login Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Login failed"

            });

        }

    }
);

// ==========================================================
// EMPLOYEE SELF ATTENDANCE - AUTO IN / OUT
// Only employees already present in the Employee collection can mark attendance.
// ==========================================================
app.post("/attendance", async (req, res) => {
    try {
        const mobileInput = String(req.body.mobile || "").trim().replace(/\s+/g, "");
        const photo = req.body.photo || "";

        if (!mobileInput) {
            return res.status(400).json({ success: false, message: "Mobile number is required" });
        }

        // Look up the employee directly in the database. Never trust an employee ID/name from the browser.
        const employee = await Employee.findOne({ mobile: mobileInput }).lean();
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found with this mobile number. Contact your admin." });
        }

        const employeeId = String(employee.employeeId || "").trim();
        if (!employeeId) {
            return res.status(500).json({ success: false, message: "Employee ID missing in employee record" });
        }

        const today = getIndiaDate();
        const currentTime = getIndiaTime();
        let attendance = await Attendance.findOne({ employeeId, date: today });

        if (!attendance) {
            attendance = new Attendance({
                employeeId,
                employeeName: String(employee.name || "").trim(),
                date: today,
                checkInTime: currentTime,
                checkOutTime: "",
                workHours: 0,
                status: "Present",
                dayType: "Full Day",
                photo
            });

            try {
                await attendance.save();
                return res.status(200).json({
                    success: true,
                    action: "IN",
                    message: `IN marked successfully for ${employee.name} at ${currentTime}`,
                    attendance
                });
            } catch (saveError) {
                if (saveError.code !== 11000) throw saveError;
                attendance = await Attendance.findOne({ employeeId, date: today });
            }
        }

        if (attendance && !String(attendance.checkOutTime || "").trim()) {
            const workHours = calculateWorkHours(String(attendance.checkInTime || "").trim(), currentTime);
            attendance.checkOutTime = currentTime;
            attendance.workHours = workHours;
            attendance.status = "Present";
            attendance.dayType = attendance.dayType || "Full Day";
            if (photo) attendance.photo = photo;
            await attendance.save();

            return res.status(200).json({
                success: true,
                action: "OUT",
                message: `OUT marked successfully for ${employee.name} at ${currentTime}. Work Hours: ${workHours} hrs`,
                attendance
            });
        }

        if (attendance && String(attendance.checkOutTime || "").trim()) {
            return res.status(409).json({
                success: false,
                alreadyMarked: true,
                action: "ALREADY_OUT",
                message: `Attendance already completed. IN: ${attendance.checkInTime}, OUT: ${attendance.checkOutTime}`,
                attendance
            });
        }

        return res.status(500).json({ success: false, message: "Unable to process attendance" });
    } catch (error) {
        console.error("❌ EMPLOYEE ATTENDANCE ERROR:", error);
        if (error.code === 11000) {
            return res.status(409).json({ success: false, alreadyMarked: true, message: "Attendance record already exists for today" });
        }
        return res.status(500).json({ success: false, message: "Server error while saving attendance" });
    }
});

// ==========================================================
// ADMIN SAVE ATTENDANCE
// ==========================================================

app.post(
    "/api/attendance/save",
    async (req, res) => {

        try {

            const attendanceList =
                req.body.attendance;

            if (
                !Array.isArray(
                    attendanceList
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid attendance data"

                });

            }

            if (
                attendanceList.length === 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "No attendance records received"

                });

            }

            let savedCount = 0;
            let skippedCount = 0;

            const skippedRecords = [];

            for (
                const record
                of attendanceList
            ) {

                const employeeId =
                    String(
                        record.employeeId || ""
                    ).trim();

                const employeeName =
                    String(
                        record.employeeName || ""
                    ).trim();

                const date =
                    String(
                        record.date || ""
                    ).trim();

                let status =
                    String(
                        record.status ||
                        "Present"
                    ).trim();

                if (
                    !employeeId ||
                    !employeeName ||
                    !date
                ) {

                    skippedCount++;

                    skippedRecords.push({

                        employeeId:
                            employeeId,

                        reason:
                            "Employee ID, name or date missing"

                    });

                    continue;

                }

                if (
                    !/^\d{4}-\d{2}-\d{2}$/.test(
                        date
                    )
                ) {

                    skippedCount++;

                    skippedRecords.push({

                        employeeId:
                            employeeId,

                        date:
                            date,

                        reason:
                            "Invalid date format"

                    });

                    continue;

                }

                const employee =
                    await Employee.findOne({

                        employeeId:
                            employeeId

                    }).lean();

                if (!employee) {

                    skippedCount++;

                    skippedRecords.push({

                        employeeId:
                            employeeId,

                        date:
                            date,

                        reason:
                            "Employee not found"

                    });

                    continue;

                }

                const finalEmployeeName =
                    String(
                        employee.name ||
                        employeeName
                    ).trim();

                if (
                    ![
                        "Present",
                        "Absent",
                        "Leave"
                    ].includes(
                        status
                    )
                ) {

                    status =
                        "Present";

                }

                const existing =
                    await Attendance.findOne({

                        employeeId:
                            employeeId,

                        date:
                            date

                    }).lean();

                let incomingCheckIn =
                    String(
                        record.checkInTime || ""
                    ).trim();

                let checkInTime;

                if (incomingCheckIn) {

                    checkInTime =
                        incomingCheckIn;

                } else if (
                    existing &&
                    existing.checkInTime
                ) {

                    checkInTime =
                        existing.checkInTime;

                } else if (
                    status ===
                    "Present"
                ) {

                    checkInTime =
                        getIndiaTime();

                } else {

                    checkInTime =
                        "00:00";

                }

                const incomingCheckOut =
                    String(
                        record.checkOutTime || ""
                    ).trim();

                let checkOutTime;

                if (incomingCheckOut) {

                    checkOutTime =
                        incomingCheckOut;

                } else if (
                    existing &&
                    existing.checkOutTime
                ) {

                    checkOutTime =
                        existing.checkOutTime;

                } else {

                    checkOutTime =
                        "";

                }

                let workHours;

                const hasWorkHours =
                    Object.prototype.hasOwnProperty.call(
                        record,
                        "workHours"
                    ) &&
                    record.workHours !== "" &&
                    record.workHours !== null &&
                    record.workHours !== undefined;

                if (hasWorkHours) {

                    workHours =
                        Number(
                            record.workHours
                        );

                } else if (
                    existing &&
                    Number.isFinite(
                        Number(
                            existing.workHours
                        )
                    )
                ) {

                    workHours =
                        Number(
                            existing.workHours
                        );

                } else if (
                    checkInTime &&
                    checkOutTime
                ) {

                    workHours =
                        calculateWorkHours(
                            checkInTime,
                            checkOutTime
                        );

                } else {

                    workHours =
                        0;

                }

                if (
                    !Number.isFinite(
                        workHours
                    )
                ) {

                    workHours =
                        0;

                }

                if (
                    workHours < 0
                ) {

                    workHours =
                        0;

                }

                let dayType;

                if (
                    status ===
                    "Present"
                ) {

                    dayType =
                        String(
                            record.dayType ||
                            existing?.dayType ||
                            "Full Day"
                        ).trim();

                    if (
                        ![
                            "Full Day",
                            "Half Day"
                        ].includes(
                            dayType
                        )
                    ) {

                        dayType =
                            "Full Day";

                    }

                } else if (
                    status ===
                    "Leave"
                ) {

                    dayType =
                        "Leave";

                } else {

                    dayType =
                        "Absent";

                }

                const photo =
                    record.photo ||
                    existing?.photo ||
                    "";

                await Attendance.updateOne(

                    {

                        employeeId:
                            employeeId,

                        date:
                            date

                    },

                    {

                        $set: {

                            employeeId:
                                employeeId,

                            employeeName:
                                finalEmployeeName,

                            date:
                                date,

                            status:
                                status,

                            checkInTime:
                                checkInTime,

                            checkOutTime:
                                checkOutTime,

                            workHours:
                                workHours,

                            dayType:
                                dayType,

                            photo:
                                photo

                        }

                    },

                    {

                        upsert:
                            true,

                        runValidators:
                            true

                    }

                );

                savedCount++;

            }

            if (
                savedCount === 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "No valid attendance records were saved",

                    savedCount:
                        0,

                    skippedCount:
                        skippedCount,

                    skippedRecords:
                        skippedRecords

                });

            }

            return res.status(200).json({

                success: true,

                message:
                    `Attendance saved successfully for ${savedCount} employee(s).`,

                count:
                    savedCount,

                savedCount:
                    savedCount,

                skippedCount:
                    skippedCount,

                skippedRecords:
                    skippedRecords

            });

        } catch (error) {

            console.error(
                "❌ ADMIN ATTENDANCE SAVE ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Attendance save failed"

            });

        }

    }
);

// ==========================================================
// STRICT DATE-WISE ATTENDANCE
// ==========================================================

app.get(
    "/api/attendance",
    async (req, res) => {

        try {

            const selectedDate =
                String(
                    req.query.date || ""
                ).trim();

            if (!selectedDate) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please select attendance date."

                });

            }

            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(
                    selectedDate
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid date format. Use YYYY-MM-DD."

                });

            }

            const records =
                await Attendance
                    .find({
                        date:
                            selectedDate
                    })
                    .sort({
                        employeeName: 1
                    })
                    .lean();

            const attendance =
                records.map(
                    record => ({

                        employeeId:
                            String(
                                record.employeeId || ""
                            ).trim(),

                        employeeName:
                            String(
                                record.employeeName || ""
                            ).trim(),

                        status:
                            record.status ||
                            "Present",

                        checkInTime:
                            record.checkInTime ||
                            "",

                        checkOutTime:
                            record.checkOutTime ||
                            "",

                        workHours:
                            Number(
                                record.workHours || 0
                            ),

                        date:
                            record.date ||
                            selectedDate,

                        dayType:
                            record.dayType ||
                            "",

                        photo:
                            record.photo ||
                            ""

                    })
                );

            return res.status(200).json({

                success: true,

                date:
                    selectedDate,

                totalEmployees:
                    attendance.length,

                savedRecords:
                    attendance.length,

                attendance:
                    attendance

            });

        } catch (error) {

            console.error(
                "❌ GET DATE-WISE ATTENDANCE ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to load attendance"

            });

        }

    }
);

// ==========================================================
// DEBUG ATTENDANCE
// ==========================================================

app.get(
    "/api/attendance/debug",
    async (req, res) => {

        try {

            const selectedDate =
                String(
                    req.query.date || ""
                ).trim();

            if (!selectedDate) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Date required"

                });

            }

            const records =
                await Attendance.find({

                    date:
                        selectedDate

                })
                    .sort({
                        employeeName: 1
                    })
                    .lean();

            return res.json({

                success: true,

                date:
                    selectedDate,

                count:
                    records.length,

                records:
                    records

            });

        } catch (error) {

            return res.status(500).json({

                success: false,

                message:
                    error.message

            });

        }

    }
);

// ==========================================================
// ATTENDANCE SUMMARY
// ==========================================================

app.get(
    "/api/attendance/summary",
    async (req, res) => {

        try {

            const date =
                String(
                    req.query.date || ""
                ).trim();

            if (!date) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Date is required"

                });

            }

            const records =
                await Attendance.find({

                    date:
                        date

                }).lean();

            const total =
                records.length;

            const present =
                records.filter(
                    record =>
                        record.status ===
                        "Present"
                ).length;

            const absent =
                records.filter(
                    record =>
                        record.status ===
                        "Absent"
                ).length;

            const leave =
                records.filter(
                    record =>
                        record.status ===
                        "Leave"
                ).length;

            const halfDay =
                records.filter(
                    record =>
                        record.dayType ===
                        "Half Day"
                ).length;

            return res.json({

                success: true,

                date:
                    date,

                total:
                    total,

                present:
                    present,

                absent:
                    absent,

                leave:
                    leave,

                halfDay:
                    halfDay

            });

        } catch (error) {

            console.error(
                "❌ Attendance Summary Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message

            });

        }

    }
);

// ==========================================================
// EMPLOYEE ATTENDANCE HISTORY
// ==========================================================

app.get(
    "/api/attendance/:employeeId",
    async (req, res) => {

        try {

            const employeeId =
                String(
                    req.params.employeeId || ""
                ).trim();

            const selectedDate =
                String(
                    req.query.date || ""
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

            const query = {

                employeeId:
                    employeeId

            };

            if (selectedDate) {

                query.date =
                    selectedDate;

            }

            const records =
                await Attendance
                    .find(query)
                    .sort({
                        date: -1
                    })
                    .lean();

            const attendance =
                records.map(
                    record => ({

                        employeeId:
                            employeeId,

                        employeeName:
                            String(
                                record.employeeName ||
                                employee.name ||
                                ""
                            ).trim(),

                        status:
                            record.status ||
                            "Present",

                        checkInTime:
                            record.checkInTime ||
                            "",

                        checkOutTime:
                            record.checkOutTime ||
                            "",

                        workHours:
                            Number(
                                record.workHours || 0
                            ),

                        date:
                            record.date ||
                            "",

                        dayType:
                            record.dayType ||
                            "",

                        photo:
                            record.photo ||
                            ""

                    })
                );

            return res.json({

                success: true,

                employeeId:
                    employeeId,

                employeeName:
                    employee.name ||
                    "",

                date:
                    selectedDate ||
                    null,

                totalRecords:
                    attendance.length,

                attendance:
                    attendance

            });

        } catch (error) {

            console.error(
                "❌ EMPLOYEE ATTENDANCE ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to load employee attendance"

            });

        }

    }
);

// ==========================================================
// DELETE ATTENDANCE
// ==========================================================

app.delete(
    "/api/attendance/:employeeId/:date",
    async (req, res) => {

        try {

            const employeeId =
                String(
                    req.params.employeeId || ""
                ).trim();

            const date =
                String(
                    req.params.date || ""
                ).trim();

            if (!employeeId || !date) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Employee ID and date are required"

                });

            }

            const deleted =
                await Attendance.findOneAndDelete({

                    employeeId:
                        employeeId,

                    date:
                        date

                });

            if (!deleted) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Attendance record not found"

                });

            }

            return res.json({

                success: true,

                message:
                    "Attendance deleted successfully",

                employeeId:
                    employeeId,

                date:
                    date

            });

        } catch (error) {

            console.error(
                "❌ DELETE ATTENDANCE ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message

            });

        }

    }
);

// ==========================================================
// API 404 HANDLER
// ==========================================================

app.use(
    "/api",
    (req, res) => {

        return res.status(404).json({

            success: false,

            message:
                `API route not found: ${req.method} ${req.originalUrl}`

        });

    }
);

// ==========================================================
// GLOBAL ERROR HANDLER
// ==========================================================

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "❌ GLOBAL SERVER ERROR:",
            error
        );

        if (
            res.headersSent
        ) {

            return next(error);

        }

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Internal Server Error"

        });

    }
);

// ==========================================================
// MONGODB CONNECTION
// ==========================================================

mongoose
    .connect(
        process.env.MONGODB_URI
    )

    .then(() => {

        console.log(
            "=========================================="
        );

        console.log(
            "✅ MongoDB Connected"
        );

        console.log(
            "📦 Database: erms"
        );

        console.log(
            "📅 ATTENDANCE SYSTEM READY"
        );

        console.log(
            "👤 EMPLOYEE ATTENDANCE READY"
        );

        console.log(
            "🟢 AUTO IN READY"
        );

        console.log(
            "🔴 AUTO OUT READY"
        );

        console.log(
            "📋 EMPLOYEE TASK SYSTEM READY"
        );

        console.log(
            "💬 EMPLOYEE COMMENT SYSTEM READY"
        );

        console.log(
            "↩️ ADMIN REPLY SYSTEM READY"
        );

        console.log(
            "=========================================="
        );

        app.listen(

            
            PORT,
            () => {

                console.log(
                    `🚀 Server running at http://localhost:${PORT}`
                );

                console.log("");

                console.log(
                    "📌 AUTH:"
                );

                console.log(
                    "   POST /adminLogin"
                );

                console.log(
                    "   POST /employeeLogin"
                );

                console.log(
                    "   POST /api/login"
                );

                console.log("");

                console.log(
                    "👥 EMPLOYEE:"
                );

                console.log(
                    "   POST /api/employees"
                );

                console.log(
                    "   GET  /api/employees"
                );

                console.log("");

                console.log(
                    "📋 TASK:"
                );

                console.log(
                    "   GET  /api/task/employee/EMP001"
                );

                console.log(
                    "   GET  /api/task/employee/EMP001/TASKID"
                );

                console.log(
                    "   POST /api/task/TASKID/comment"
                );

                console.log(
                    "   GET  /api/task/TASKID/comments"
                );

                console.log(
                    "   POST /api/task/TASKID/reply"
                );

                console.log(
                    "   GET  /api/task/comment/COMMENTID/replies"
                );

                console.log("");

                console.log(
                    "📊 ATTENDANCE:"
                );

                console.log(
                    "   POST /attendance"
                );

                console.log(
                    "   POST /api/attendance/save"
                );

                console.log(
                    "   GET  /api/attendance?date=YYYY-MM-DD"
                );

                console.log(
                    "   GET  /api/attendance/EMP001"
                );

                console.log("");

                console.log(
                    "=========================================="
                );

            }
        );

    })

    .catch(
        error => {

            console.error(
                "❌ MongoDB Connection Error:",
                error
            );

            process.exit(1);

        }
    );
