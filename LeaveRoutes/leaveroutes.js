const express = require("express");
const router = express.Router();

const Leave = require("../models/leave");
const Notification = require("../models/notification");

// ======================================================
// EMPLOYEE SUBMIT LEAVE REQUEST
// ======================================================

router.post("/leave", async (req, res) => {
  try {

    const {
      empId,
      name,
      leaveDate,
      leaveType,
      reason
    } = req.body;

    // ---------------- VALIDATION ----------------

    if (!empId || !name || !leaveDate || !leaveType || !reason) {

      return res.status(400).json({
        success: false,
        message: "All leave fields are required"
      });

    }

    // ---------------- CREATE LEAVE ----------------

    const newLeave = new Leave({

      empId: empId.trim(),

      name: name.trim(),

      leaveDate: leaveDate.trim(),

      leaveType: leaveType.trim(),

      reason: reason.trim(),

      status: "Pending"

    });

    await newLeave.save();


    // ==================================================
    // 🔔 NOTIFICATION TO ADMIN
    // ==================================================

    try {

      await Notification.create({

        title: "New Leave Request",

        message:
          `${name.trim()} submitted a ${leaveType.trim()} leave request for ${leaveDate.trim()}.`,

        type: "leave",

        recipientType: "admin",

        employeeId: empId.trim(),

        employeeName: name.trim(),

        isRead: false,

        createdBy: name.trim()

      });

      console.log(
        "🔔 Admin notification created for leave:",
        empId
      );

    } catch (notificationError) {

      console.error(
        "Admin notification error:",
        notificationError
      );

      // Leave save झालेली असल्यामुळे
      // notification error मुळे leave fail करू नये

    }


    // ---------------- RESPONSE ----------------

    res.status(201).json({

      success: true,

      message: "Leave request submitted successfully",

      leave: newLeave

    });

  }

  catch (error) {

    console.error(
      "Leave submit error:",
      error
    );

    res.status(500).json({

      success: false,

      message: "Error submitting leave request"

    });

  }

});


// ======================================================
// ADMIN GET ALL LEAVE REQUESTS
// ======================================================

router.get("/leave", async (req, res) => {

  try {

    const leaves = await Leave.find()

      .sort({
        createdAt: -1
      })

      .lean();

    res.json(leaves);

  }

  catch (error) {

    console.error(
      "Load leaves error:",
      error
    );

    res.status(500).json({

      success: false,

      message: "Error loading leave requests"

    });

  }

});


// ======================================================
// ADMIN GET PENDING LEAVE REQUESTS
// Used for notification bell
// ======================================================

router.get("/pending", async (req, res) => {

  try {

    const leaves = await Leave.find({

      status: "Pending"

    })

      .sort({
        createdAt: -1
      })

      .lean();

    res.json({

      success: true,

      count: leaves.length,

      leaves: leaves

    });

  }

  catch (error) {

    console.error(
      "Pending leaves error:",
      error
    );

    res.status(500).json({

      success: false,

      count: 0,

      leaves: [],

      message: "Error loading pending leave requests"

    });

  }

});


// ======================================================
// ADMIN ACCEPT / REJECT LEAVE
// ======================================================

router.put("/leave/:id", async (req, res) => {

  try {

    const {
      status
    } = req.body;


    // ==================================================
    // ONLY THESE STATUSES ARE ALLOWED
    // ==================================================

    if (
      ![
        "Pending",
        "Accepted",
        "Rejected"
      ].includes(status)
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid leave status. Use Pending, Accepted or Rejected."

      });

    }


    // ==================================================
    // FIND LEAVE FIRST
    // ==================================================

    const existingLeave =
      await Leave.findById(
        req.params.id
      );


    if (!existingLeave) {

      return res.status(404).json({

        success: false,

        message:
          "Leave request not found"

      });

    }


    // ==================================================
    // UPDATE STATUS
    // ==================================================

    existingLeave.status =
      status;

    await existingLeave.save();


    // ==================================================
    // 🔔 NOTIFICATION TO EMPLOYEE
    // ==================================================

    try {

      let notificationTitle = "";

      let notificationMessage = "";


      if (status === "Accepted") {

        notificationTitle =
          "Leave Request Accepted";

        notificationMessage =
          `Your ${existingLeave.leaveType} leave request for ${existingLeave.leaveDate} has been accepted by Admin.`;

      }

      else if (status === "Rejected") {

        notificationTitle =
          "Leave Request Rejected";

        notificationMessage =
          `Your ${existingLeave.leaveType} leave request for ${existingLeave.leaveDate} has been rejected by Admin.`;

      }

      else {

        notificationTitle =
          "Leave Request Updated";

        notificationMessage =
          `Your ${existingLeave.leaveType} leave request status is Pending.`;

      }


      await Notification.create({

        title:
          notificationTitle,

        message:
          notificationMessage,

        type:
          "leave",

        recipientType:
          "employee",

        employeeId:
          existingLeave.empId,

        employeeName:
          existingLeave.name,

        isRead:
          false,

        createdBy:
          "Admin"

      });


      console.log(
        "🔔 Employee notification created:",
        existingLeave.empId,
        status
      );

    }

    catch (notificationError) {

      console.error(
        "Employee notification error:",
        notificationError
      );

    }


    // ==================================================
    // RESPONSE
    // ==================================================

    res.json({

      success: true,

      message:
        `Leave request ${status}`,

      leave:
        existingLeave

    });

  }

  catch (error) {

    console.error(
      "Leave status update error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Error updating leave status"

    });

  }

});


module.exports = router;