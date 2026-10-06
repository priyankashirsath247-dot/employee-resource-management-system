const express = require("express");
const router = express.Router();

const Task = require("../models/task");
const Employee = require("../models/employee");


// =====================================================
// GET ALL EMPLOYEES FOR TASK ASSIGNMENT
// =====================================================
router.get("/task/employees", async (req, res) => {
  try {
    const employees = await Employee.find({})
      .select("employeeId name department position email")
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      employees
    });

  } catch (error) {
    console.error("Load employees for task error:", error);

    res.status(500).json({
      success: false,
      message: "Error loading employees",
      employees: []
    });
  }
});


// =====================================================
// ADMIN CREATE / ASSIGN TASK
// =====================================================
router.post("/task", async (req, res) => {
  try {
    const {
      taskTitle,
      description,
      employeeId,
      priority,
      startDate,
      dueDate
    } = req.body;


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------
    if (
      !taskTitle ||
      !description ||
      !employeeId ||
      !startDate ||
      !dueDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields"
      });
    }


    // -------------------------------------------------
    // CHECK EMPLOYEE
    // -------------------------------------------------
    const employee = await Employee.findOne({
      employeeId: employeeId.trim()
    });


    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }


    // -------------------------------------------------
    // CREATE TASK
    // -------------------------------------------------
    const newTask = new Task({
      taskTitle: taskTitle.trim(),

      description: description.trim(),

      employeeId: employee.employeeId,

      employeeName: employee.name,

      priority: priority || "Medium",

      startDate,

      dueDate,

      status: "Assigned",

      assignedBy: "Admin"
    });


    await newTask.save();


    res.status(201).json({
      success: true,
      message: "Task assigned successfully",
      task: newTask
    });


  } catch (error) {
    console.error("Create task error:", error);

    res.status(500).json({
      success: false,
      message: "Error creating task"
    });
  }
});


// =====================================================
// EMPLOYEE GET ASSIGNED TASKS
// =====================================================
router.get("/task/employee/:employeeId", async (req, res) => {
  try {
    const employeeId = req.params.employeeId.trim();


    // -------------------------------------------------
    // CHECK EMPLOYEE EXISTS
    // -------------------------------------------------
    const employee = await Employee.findOne({
      employeeId
    }).lean();


    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
        tasks: []
      });
    }


    // -------------------------------------------------
    // GET ONLY THIS EMPLOYEE'S TASKS
    // -------------------------------------------------
    const tasks = await Task.find({
      employeeId
    })
      .sort({ createdAt: -1 })
      .lean();


    res.json({
      success: true,
      tasks
    });


  } catch (error) {
    console.error("Employee tasks error:", error);

    res.status(500).json({
      success: false,
      message: "Error loading employee tasks",
      tasks: []
    });
  }
});


// =====================================================
// ADMIN GET ALL TASKS
// =====================================================
router.get("/task", async (req, res) => {
  try {
    const tasks = await Task.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      tasks
    });

  } catch (error) {
    console.error("Load tasks error:", error);

    res.status(500).json({
      success: false,
      message: "Error loading tasks",
      tasks: []
    });
  }
});


// =====================================================
// GET SINGLE TASK
// =====================================================
router.get("/task/:id", async (req, res) => {
  try {
    const task = await Task.findById(
      req.params.id
    ).lean();


    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }


    res.json({
      success: true,
      task
    });


  } catch (error) {
    console.error("Get task error:", error);

    res.status(500).json({
      success: false,
      message: "Error loading task"
    });
  }
});


// =====================================================
// ADMIN UPDATE TASK
// =====================================================
router.put("/task/:id", async (req, res) => {
  try {
    const {
      taskTitle,
      description,
      employeeId,
      employeeName,
      priority,
      startDate,
      dueDate,
      status
    } = req.body;


    const updateData = {};


    // -------------------------------------------------
    // TASK TITLE
    // -------------------------------------------------
    if (taskTitle !== undefined) {
      updateData.taskTitle = taskTitle.trim();
    }


    // -------------------------------------------------
    // DESCRIPTION
    // -------------------------------------------------
    if (description !== undefined) {
      updateData.description = description.trim();
    }


    // -------------------------------------------------
    // EMPLOYEE
    // -------------------------------------------------
    if (employeeId !== undefined) {

      const employee = await Employee.findOne({
        employeeId: employeeId.trim()
      });


      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found"
        });
      }


      updateData.employeeId =
        employee.employeeId;

      updateData.employeeName =
        employee.name;

    } else if (employeeName !== undefined) {

      updateData.employeeName =
        employeeName.trim();
    }


    // -------------------------------------------------
    // PRIORITY
    // -------------------------------------------------
    if (priority !== undefined) {
      updateData.priority = priority;
    }


    // -------------------------------------------------
    // START DATE
    // -------------------------------------------------
    if (startDate !== undefined) {
      updateData.startDate = startDate;
    }


    // -------------------------------------------------
    // DUE DATE
    // -------------------------------------------------
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate;
    }


    // -------------------------------------------------
    // STATUS
    // -------------------------------------------------
    if (status !== undefined) {

      const allowedStatus = [
        "Assigned",
        "In Progress",
        "Completed",
        "Cancelled"
      ];


      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status"
        });
      }


      updateData.status = status;
    }


    // -------------------------------------------------
    // UPDATE TASK
    // -------------------------------------------------
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );


    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }


    res.json({
      success: true,
      message: "Task updated successfully",
      task
    });


  } catch (error) {
    console.error("Update task error:", error);

    res.status(500).json({
      success: false,
      message: "Error updating task"
    });
  }
});


// =====================================================
// EMPLOYEE UPDATE TASK STATUS
// =====================================================
router.put("/task/:id/status", async (req, res) => {
  try {
    const {
      employeeId,
      status
    } = req.body;


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------
    if (!employeeId || !status) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and status are required"
      });
    }


    // -------------------------------------------------
    // ALLOWED STATUS
    // -------------------------------------------------
    const allowedStatus = [
      "Assigned",
      "In Progress",
      "Completed",
      "Cancelled"
    ];


    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }


    // -------------------------------------------------
    // FIND TASK
    // -------------------------------------------------
    const task = await Task.findById(
      req.params.id
    );


    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }


    // -------------------------------------------------
    // CHECK TASK ASSIGNED TO EMPLOYEE
    // -------------------------------------------------
    if (
      task.employeeId !==
      employeeId.trim()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not assigned to this task"
      });
    }


    // -------------------------------------------------
    // UPDATE STATUS
    // -------------------------------------------------
    task.status = status;

    await task.save();


    res.json({
      success: true,
      message:
        "Task status updated successfully",
      task
    });


  } catch (error) {
    console.error(
      "Update task status error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Error updating task status"
    });
  }
});


// =====================================================
// EMPLOYEE ADD PROGRESS COMMENT
// =====================================================
router.post("/task/:id/comment", async (req, res) => {
  try {
    const {
      employeeId,
      comment
    } = req.body;


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------
    if (
      !employeeId ||
      !comment ||
      !comment.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Employee ID and comment are required"
      });
    }


    // -------------------------------------------------
    // FIND TASK
    // -------------------------------------------------
    const task = await Task.findById(
      req.params.id
    );


    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }


    // -------------------------------------------------
    // CHECK TASK ASSIGNED TO EMPLOYEE
    // -------------------------------------------------
    if (
      task.employeeId !==
      employeeId.trim()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not assigned to this task"
      });
    }


    // -------------------------------------------------
    // ADD COMMENT
    // -------------------------------------------------
    task.comments.push({
      employeeId: employeeId.trim(),
      comment: comment.trim(),
      createdAt: new Date()
    });


    // -------------------------------------------------
    // IF ASSIGNED → IN PROGRESS
    // -------------------------------------------------
    if (task.status === "Assigned") {
      task.status = "In Progress";
    }


    await task.save();


    res.json({
      success: true,
      message:
        "Progress comment added successfully",
      task
    });


  } catch (error) {
    console.error(
      "Add comment error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Error adding progress comment"
    });
  }
});


// =====================================================
// GET TASK COMMENTS
// =====================================================
router.get("/task/:id/comments", async (req, res) => {
  try {
    const task = await Task.findById(
      req.params.id
    )
      .select("comments")
      .lean();


    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
        comments: []
      });
    }


    res.json({
      success: true,
      comments: task.comments || []
    });


  } catch (error) {
    console.error(
      "Load task comments error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Error loading comments",
      comments: []
    });
  }
});


// =====================================================
// DELETE TASK
// =====================================================
router.delete("/task/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(
      req.params.id
    );


    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }


    res.json({
      success: true,
      message: "Task deleted successfully"
    });


  } catch (error) {
    console.error(
      "Delete task error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Error deleting task"
    });
  }
});


module.exports = router;
// ==========================================================
// EMPLOYEE ADD COMMENT TO TASK
// POST /api/task/:taskId/comment
// ==========================================================

router.post("/task/:taskId/comment", async (req, res) => {

    try {

        const taskId = req.params.taskId;

        const employeeId = String(
            req.body.employeeId || ""
        ).trim();

        const employeeName = String(
            req.body.employeeName || ""
        ).trim();

        const comment = String(
            req.body.comment || ""
        ).trim();

        // ------------------------------------------
        // VALIDATION
        // ------------------------------------------

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: "Employee ID is required"
            });
        }

        if (!employeeName) {
            return res.status(400).json({
                success: false,
                message: "Employee name is required"
            });
        }

        if (!comment) {
            return res.status(400).json({
                success: false,
                message: "Please enter a comment"
            });
        }

        // ------------------------------------------
        // FIND TASK
        // ------------------------------------------

        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        // ------------------------------------------
        // IMPORTANT
        // Employee can comment ONLY on own task
        // ------------------------------------------

        if (
            String(task.employeeId).trim() !==
            employeeId
        ) {
            return res.status(403).json({
                success: false,
                message: "You cannot comment on this task"
            });
        }

        // ------------------------------------------
        // ADD COMMENT
        // ------------------------------------------

        task.comments.push({
            employeeId: employeeId,
            employeeName: employeeName,
            comment: comment,
            createdAt: new Date()
        });

        await task.save();

        console.log(
            "💬 Employee Comment Added:",
            employeeName,
            "| Task:",
            task.taskTitle
        );

        return res.status(200).json({

            success: true,

            message:
                "Comment added successfully",

            comment:
                task.comments[
                    task.comments.length - 1
                ]

        });

    } catch (error) {

        console.error(
            "❌ Add Task Comment Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to add comment"
        });

    }

});