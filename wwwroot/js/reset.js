// ---------------- Theme ----------------
const menuItems = document.querySelectorAll(".menu h2");
const root = document.documentElement;
const toggle = document.getElementById("toggle");
const sunIcon = document.querySelector(".toggle .bxs-sun");
const moonIcon = document.querySelector(".toggle .bx-moon");

if(localStorage.getItem("theme") === "dark") {
    root.classList.add("dark");
    toggle.checked = true;
}

toggle.addEventListener("change", () => {
    root.classList.toggle("dark");
    localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light");
    sunIcon.className = sunIcon.className.includes("bxs") ? "bx bx-sun" : "bx bxs-sun";
    moonIcon.className = moonIcon.className.includes("bxs") ? "bx bx-moon" : "bx bxs-moon";
});

// ---------------- Password Toggle ----------------
const togglePasswordBtns = document.querySelectorAll(".toggle-password");

togglePasswordBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const input = btn.parentElement.querySelector("input");
    if (input.type === "password") {
      input.type = "text";
      btn.classList.replace("bx-hide", "bx-show");
    } else {
      input.type = "password";
      btn.classList.replace("bx-show", "bx-hide");
    }
  });
});

// ---------------- Check Password Match ----------------
const form = document.querySelector("form");
form.addEventListener("submit", (e) => {
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmpassword").value;

  if (password !== confirmPassword) {
    e.preventDefault();
    alert("รหัสผ่านไม่ตรงกัน โปรดใส่รหัสผ่านใหม่");
  }
});