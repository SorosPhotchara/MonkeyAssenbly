// ---------------- Config ----------------
const SERVER_URL = "http://localhost:3000";
const currentUserId = localStorage.getItem("userId");
const urlParams = new URLSearchParams(window.location.search);
const activityId = urlParams.get("id");
if (!activityId) alert("ไม่พบ ID ของกิจกรรม");

// ---------------- Theme / Sidebar ----------------
const menuItems = document.querySelectorAll(".menu h2");
const root = document.documentElement;
const toggle = document.getElementById("toggle");
const sunIcon = document.querySelector(".toggle .bxs-sun");
const moonIcon = document.querySelector(".toggle .bx-moon");

if (localStorage.getItem("theme") === "dark") {
  root.classList.add("dark");
  toggle.checked = true;
}

toggle.addEventListener("change", () => {
  root.classList.toggle("dark");
  localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light");
  sunIcon.className = sunIcon.className.includes("bxs") ? "bx bx-sun" : "bx bxs-sun";
  moonIcon.className = moonIcon.className.includes("bxs") ? "bx bx-moon" : "bx bxs-moon";
});

// ---------------- Sidebar ----------------
const sidebarLinks = document.querySelectorAll(".sidebar a");
sidebarLinks.forEach((link, index) => {
    link.addEventListener("click", e => {
        e.preventDefault();
        sidebarLinks.forEach(el => el.classList.remove("active"));
        link.classList.add("active");

        switch (index) {
            case 0: window.location.href = "/frontend/HTML/home.html"; break;
            case 1: window.location.href = "/frontend/HTML/tags.html"; break;
            case 2: alert("Create event modal here"); break;
            case 3: window.location.href = "/frontend/HTML/notify.html"; break;
            case 4: window.location.href = "/frontend/HTML/profile.html"; break;
        }
    });
});

// ---------------- Hamburger Menu ----------------
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

function updateMenu() {
    menuList.innerHTML = "";
    if (!isLoggedIn) {
        addMenuItem("เข้าสู่ระบบ", () => window.location.href = "/frontend/HTML/login.html");
        addMenuItem("สมัครสมาชิก", () => window.location.href = "/frontend/HTML/signup.html");
    } else {
        addMenuItem("โปรไฟล์ของฉัน", () => window.location.href = "/frontend/HTML/profile.html");
        addMenuItem("ออกจากระบบ", async () => {
            await fetch(`${SERVER_URL}/Account/Logout`, { method: "POST" });
            localStorage.setItem("isLoggedIn", "false");
            isLoggedIn = false;
            updateMenu();
            alert("ออกจากระบบเรียบร้อย");
        });
    }
}

updateMenu();

let menuOpen = false;
hamburgerBtn.addEventListener("click", () => {
    menuOpen = !menuOpen;
    hamburgerMenu.style.display = menuOpen ? "block" : "none";
});

// ---------------- Load Activity ----------------
async function loadActivity() {
    try {
        const res = await fetch(`${SERVER_URL}/api/activity/${activityId}`);
        if (!res.ok) throw new Error("ไม่พบกิจกรรม");
        const data = await res.json();

        document.getElementById("activityTitle").textContent = data.title;
        document.getElementById("activityTag").innerHTML = `<strong>Tag :</strong> ${data.tag}`;
        document.getElementById("activityDeadline").innerHTML = `${data.deadline}`;
        document.getElementById("activityHost").textContent = data.host;
        document.getElementById("activityPlace").textContent = data.place;
        document.getElementById("activityDetails").textContent = data.details;
    } catch (err) {
        alert(err.message);
    }
}

// ---------------- Load Participants ----------------
async function loadParticipants() {
    try {
        const res = await fetch(`${SERVER_URL}/api/activity/${activityId}/participants`);
        if (!res.ok) throw new Error("โหลดผู้เข้าร่วมไม่สำเร็จ");
        const participants = await res.json();

        const approvedBox = document.getElementById("approvedBox");
        const pendingBox = document.getElementById("pendingBox");
        approvedBox.querySelectorAll(".participant-row").forEach(e => e.remove());
        pendingBox.querySelectorAll(".participant-row").forEach(e => e.remove());

        let approvedCount = 0;
        participants.forEach(p => {
            const row = document.createElement("div");
            row.className = "participant-row";
            row.innerHTML = `<span>${p.name}</span>`;
            if (p.status === "approved") {
                approvedBox.appendChild(row);
                approvedCount++;
            } else if (p.status === "pending") {
                row.classList.add("pending");
                row.innerHTML += `
                    <div class="participant-actions">
                        <button class="accept">✔</button>
                        <button class="reject">✖</button>
                    </div>`;
                pendingBox.appendChild(row);

                const userId = p.id;
                row.querySelector(".accept").addEventListener("click", async () => {
                    await fetch(`${SERVER_URL}/api/participants/${userId}/accept`, { method: "POST" });
                    loadParticipants();
                });
                row.querySelector(".reject").addEventListener("click", async () => {
                    await fetch(`${SERVER_URL}/api/participants/${userId}/reject`, { method: "POST" });
                    loadParticipants();
                });
            }
        });
        document.getElementById("approvedCount").textContent = approvedCount;
    } catch (err) { alert(err.message); }
}

// ---------------- Load Comments ----------------
async function loadComments() {
    try {
        const res = await fetch(`${SERVER_URL}/api/activity/${activityId}/comments`);
        if (!res.ok) throw new Error("โหลดคอมเมนต์ไม่สำเร็จ");
        const comments = await res.json();

        const commentList = document.getElementById("commentList");
        commentList.innerHTML = "";
        comments.forEach(c => {
            const div = document.createElement("div");
            div.className = c.userId === currentUserId ? "comment participant" : "comment host";
            div.innerHTML = `
                <div class="avatar ${div.className.includes("host") ? "host" : "participant"}">${c.user[0]}</div>
                <div class="bubble">
                    <div class="meta">
                        <span class="name">${c.user}</span>
                        <span class="time">${c.time}</span>
                    </div>
                    <div class="text">${c.text}</div>
                </div>`;
            commentList.appendChild(div);
        });
        commentList.scrollTop = commentList.scrollHeight;
    } catch (err) { alert(err.message); }
}

// ---------------- Send Comment ----------------
document.getElementById("sendComment").addEventListener("click", async () => {
    const input = document.getElementById("commentInput");
    const text = input.value.trim();
    if (!text) return;

    await fetch(`${SERVER_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, text })
    });
    input.value = "";
    loadComments();
});

// ---------------- Action Buttons ----------------
document.querySelector(".update").addEventListener("click", async () => {
    await fetch(`${SERVER_URL}/api/activity/${activityId}`, { method: "PUT" });
    alert("อัปเดตเรียบร้อย");
});

document.querySelector(".leave").addEventListener("click", async () => {
    await fetch(`${SERVER_URL}/api/activity/${activityId}/leave`, { method: "POST" });
    alert("ยกเลิกเรียบร้อย");
});

document.querySelector(".end").addEventListener("click", async () => {
    await fetch(`${SERVER_URL}/api/activity/${activityId}/end`, { method: "POST" });
    alert("ปิดรับสมัครเรียบร้อย");
});

// ---------------- Initial Load ----------------
loadActivity();
loadParticipants();
loadComments();