const express = require("express");
const router = express.Router();

const Contact = require("../models/contact");

router.post("/contact", async (req, res) => {
    try {
        const { fullName, email, mobile, message } = req.body;

        const newContact = new Contact({
            fullName,
            email,
            mobile,
            message
        });

        await newContact.save();

        res.json({
            success: true,
            message: "Message sent successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;