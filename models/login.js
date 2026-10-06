// Jab backend se login successful ka response aaye (data.success === true)
if (data.success) {
    // Ye line ensure karegi ki jyne login kiya hai, usi ka data save ho
    localStorage.setItem("employee", JSON.stringify(data.employee)); 
    
    // Ab dashboard par bhej dein
    window.location.href = "employeeattendance.html";
}