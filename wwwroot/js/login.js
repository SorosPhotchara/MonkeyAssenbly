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

// Toggle Password
const passwordInput = document.getElementById("password");
const passwordToggle = document.querySelector(".toggle-password");

passwordToggle.addEventListener("click", () => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        passwordToggle.classList.replace("bx-hide", "bx-show");
    } else {
        passwordInput.type = "password";
        passwordToggle.classList.replace("bx-show", "bx-hide");
    }
});

loginBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      alert('Login successful');
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert('Server error');
  }
});