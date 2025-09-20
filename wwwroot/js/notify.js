// ---------------- Theme / Sidebar ----------------
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

menuItems.forEach(item => {
    item.addEventListener("click", () => {
        menuItems.forEach(el => el.classList.remove("active"));
        item.classList.add("active");
    });
});

const sidebarLinks = document.querySelectorAll(".sidebar a");
sidebarLinks.forEach((link, index) => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        sidebarLinks.forEach(el => el.classList.remove("active"));
        link.classList.add("active");

        switch(index) {
            case 0: window.location.href = window.HomeUrl; break;
            case 1: window.location.href = window.TagsUrl; break;
            case 2: modal.style.display="flex"; textarea.focus(); break;
            case 3: window.location.href = window.NotifyUrl; break;
            case 4: window.location.href = window.ProfileUrl; break; 
        }
    });
});

// ---------------- Hamburger & Menu ----------------
let isLoggedIn = localStorage.getItem("isLoggedIn") === "true"; 
const hamburgerBtn = document.getElementById("hamburgerBtn");
const hamburgerMenu = document.getElementById("hamburgerMenu");
const menuList = document.getElementById("menuList");

function addMenuItem(text, onClick) {
    const li = document.createElement("li");
    li.textContent = text;
    li.addEventListener("click", onClick);
    menuList.appendChild(li);
}

function setLoginState(state) {
    isLoggedIn = state;
    localStorage.setItem("isLoggedIn", state);
    updateMenu();
}

function updateMenu() {
    menuList.innerHTML = "";

    if (!isLoggedIn) {
        addMenuItem("เข้าสู่ระบบ", () => {
            window.location.href = "/frontend/HTML/login.html";
        });
        addMenuItem("สมัครสมาชิก", () => {
            window.location.href = "/frontend/HTML/signup.html";
        });
    } else {
        addMenuItem("โปรไฟล์ของฉัน", () => {
            window.location.href = "/frontend/HTML/profile.html";
        });

        addMenuItem("ออกจากระบบ", async () => {
            try {
                await fetch("/Account/Logout", { method: "POST" });
                setLoginState(false);
                alert("ออกจากระบบเรียบร้อย");
            } catch (err) {
                alert("เกิดข้อผิดพลาด: " + err.message);
            }
        });
    }
}

function toggleMenu(open) {
    hamburgerMenu.style.display = open ? "block" : "none";
    hamburgerBtn.querySelector("i").className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
}

let menuOpen = false;
hamburgerBtn.addEventListener("click", () => {
    menuOpen = !menuOpen;
    toggleMenu(menuOpen);
});

window.addEventListener("click", (e) => {
    if (menuOpen && !hamburgerBtn.contains(e.target) && !hamburgerMenu.contains(e.target)) {
        toggleMenu(false);
        menuOpen = false;
    }
});

updateMenu();


// ---------------- Login / Signup / Logout ----------------
function showLoginPage() {
    window.location.href = "/frontend/HTML/login.html";
}

function showSignupPage() {
    window.location.href = "/frontend/HTML/signup.html";
}

async function logoutUser() {
    try {
        await fetch("/Account/Logout", { method: "POST" });
        isLoggedIn = false;
        localStorage.setItem("isLoggedIn", "false");
        updateMenu();
        alert("ออกจากระบบเรียบร้อย");
    } catch (err) {
        alert("เกิดข้อผิดพลาด: " + err.message);
    }
}

// ตัวอย่างข้อมูลแจ้งเตือน
const notifications = [
  { user: "User1234", msg: "มาเตะบอลกันเถอะ", color: "#7B2FF2" },
  { user: "User1246", msg: "ผมอยากไปด้วยคนได้ไหม", color: "#7B2FF2" },
  { user: "User999", msg: "จองด้วยๆsๆ", color: "#1DE9B6" },
  { user: "UserGEXP", msg: "ผมไปด้วยคน", color: "#FFD600" },
  { user: "Userlikeu", msg: "ขอไปด้วย", color: "#F500A3" },
    { user: "User1234", msg: "มาเตะบอลกันเถอะ", color: "#7B2FF2" },
  { user: "User1246", msg: "ผมอยากไปด้วยคนได้ไหม", color: "#7B2FF2" },
  { user: "User999", msg: "จองด้วยๆsๆ", color: "#1DE9B6" },
  { user: "UserGEXP", msg: "ผมไปด้วยคน", color: "#FFD600" },
  { user: "Userlikeu", msg: "ขอไปด้วย", color: "#F500A3" }
];

// เลือก container
const notifyList = document.querySelector('.notify-list');
notifyList.innerHTML = ""; // ล้างข้อมูลเดิม

// สร้าง HTML สำหรับแต่ละรายการ
notifications.forEach((item) => {
  const notifyItem = document.createElement('div');
  notifyItem.className = 'notify-item';
  notifyItem.innerHTML = `
    <span class="notify-avatar" style="background:${item.color}"></span>
    <div class="notify-content">
      <span class="notify-user">${item.user}</span>
      <span class="notify-msg">${item.msg}</span>
    </div>
  `;
  notifyList.appendChild(notifyItem);
});
