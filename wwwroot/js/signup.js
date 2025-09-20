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

// ---------------- Toggle Password ----------------
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

// ---------------- Signup Form ----------------
const gender = document.getElementById("gender").value;
const signupBtn = document.querySelector(".btn-signup");

signupBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const gender = document.getElementById("gender").value.trim();
  const date = document.getElementById("date").value;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmpassword").value;
  const termsChecked = document.getElementById("terms").checked;

  if (!firstName || !lastName || !gender || !date || !email || !password || !confirmPassword) {
    alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
    return;
  }

  if (password !== confirmPassword) {
    alert("รหัสผ่านไม่ตรงกัน");
    return;
  }

  if (!termsChecked) {
    alert("กรุณายอมรับข้อตกลงก่อนสมัครสมาชิก");
    return;
  }

  try {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, gender, date, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      alert("สมัครสมาชิกสำเร็จ 🎉");
      window.location.href = "/frontend/HTML/login.html";
    } else {
      alert(data.message || "ไม่สามารถสมัครสมาชิกได้");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});