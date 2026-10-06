document.addEventListener("DOMContentLoaded", () => {

    const attendanceBtn = document.getElementById("markAttendanceBtn");

    attendanceBtn.addEventListener("click", async () => {

        // Employee information
        const employeeId = localStorage.getItem("employeeId");
        const employeeName = localStorage.getItem("employeeName");

        if (!employeeId || !employeeName) {
            alert("Employee information not found. Please login again.");
            return;
        }

        try {

            const response = await fetch("/api/attendance/checkin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    employeeId: employeeId,
                    employeeName: employeeName
                })
            });

            const data = await response.json();

            if (data.success) {
                alert("✅ Attendance Marked Successfully!");

                attendanceBtn.disabled = true;
                attendanceBtn.innerHTML = "✓ Attendance Marked";
            } else {
                alert("❌ " + data.message);
            }

        } catch (error) {

            console.error("Attendance Error:", error);
            alert("❌ Server connection error");

        }

    });

});