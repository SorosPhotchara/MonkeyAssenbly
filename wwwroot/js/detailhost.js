// ==================== TOAST NOTIFICATION SYSTEM START ====================
class ToastNotification {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (!document.querySelector('.toast-container')) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.querySelector('.toast-container');
    }
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;

    const icons = {
      success: '<i class="fa-solid fa-circle-check"></i>',
      error: '<i class="fa-solid fa-circle-xmark"></i>',
      warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
      info: '<i class="fa-solid fa-circle-info"></i>'
    };

    const titles = {
      success: 'สำเร็จ',
      error: 'ข้อผิดพลาด',
      warning: 'คำเตือน',
      info: 'แจ้งเตือน'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <div class="toast-title">${titles[type]}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    this.container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.remove(toast));

    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }

    return toast;
  }

  remove(toast) {
    toast.classList.add('removing');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  success(message, duration) { return this.show(message, 'success', duration); }
  error(message, duration) { return this.show(message, 'error', duration); }
  warning(message, duration) { return this.show(message, 'warning', duration); }
  info(message, duration) { return this.show(message, 'info', duration); }
}

const showToast = new ToastNotification();
// ==================== TOAST NOTIFICATION SYSTEM END ====================  

// ---------------- Config ----------------
const SERVER_URL = "http://localhost:7014";
const currentUserId = localStorage.getItem("userId");
const urlParams = new URLSearchParams(window.location.search);
const activityId = document.body.dataset.postId;
console.log("Post ID ที่รับมา:", activityId);

if (!activityId) showToast.error("ไม่พบ ID ของกิจกรรม");

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
            case 0: window.location.href = window.LoginUrl; break;
            case 1: window.location.href = window.TagsUrl; break;
            case 2: showToast.info("คุณสามารถสร้างกิจกรรมได้ที่หน้าหลัก"); break;
            case 3: window.location.href = window.NotifyUrl; break;
            case 4: window.location.href = window.ProfileUrl; break;
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
        addMenuItem("เข้าสู่ระบบ", () => window.location.href = window.LoginUrl);
        addMenuItem("สมัครสมาชิก", () => window.location.href = window.SignupUrl);
    } else {
        addMenuItem("โปรไฟล์ของฉัน", () => window.location.href = window.ProfileUrl);
        addMenuItem("ออกจากระบบ", async () => {
            await fetch(`${SERVER_URL}/Account/Logout`, { method: "POST" });
            localStorage.setItem("isLoggedIn", "false");
            isLoggedIn = false;
            updateMenu();
            showToast.success("ออกจากระบบเรียบร้อย");
            setTimeout(() => location.reload(), 1000);alert("ออกจากระบบเรียบร้อย");
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
        const res = await fetch(`/Post/GetPostById/${activityId}`);
        const tags = await fetch(`/Post/GetAllTags`);

        if (!res.ok) throw new Error("ไม่พบกิจกรรม");
        const data = await res.json();

        if (!tags.ok) throw new Error("ไม่พบ tags");
        const tags_data = await tags.json();

        const tagSelect = document.getElementById("tagSelect");
        tagSelect.innerHTML = `<option disabled selected>-- เลือกแท็ก --</option>`;

        tags_data.forEach(tag => {
            const option = document.createElement("option");
            option.value = tag.id;
            option.textContent = tag.name;
            tagSelect.appendChild(option);
        });


            const selectedTag = tags_data.find(t => t.name === data.tags[0]);
            if (selectedTag) tagSelect.value = selectedTag.id;

        document.getElementById("activityTitle").value = data.post.eventName;
        document.getElementById("activityDeadline").value = data.post.dateClose;
        document.getElementById("activityHost").textContent = data.post.host;
        document.getElementById("activityPlace").value = data.post.location;
        document.getElementById("activityDetails").value = data.post.description;

    } catch (err) {
        showToast.error(err.message);
        console.error("❌ ERROR:", err);
    }
}


// ---------------- Load Participants ----------------
//async function loadParticipants() {
//    try {
//        const res = await fetch(`${SERVER_URL}/api/activity/${activityId}/participants`);
//        if (!res.ok) throw new Error("โหลดผู้เข้าร่วมไม่สำเร็จ");
//        const participants = await res.json();

//        const approvedBox = document.getElementById("approvedBox");
//        const pendingBox = document.getElementById("pendingBox");
//        approvedBox.querySelectorAll(".participant-row").forEach(e => e.remove());
//        pendingBox.querySelectorAll(".participant-row").forEach(e => e.remove());

//        let approvedCount = 0;
//        participants.forEach(p => {
//            const row = document.createElement("div");
//            row.className = "participant-row";
//            row.innerHTML = `<span>${p.name}</span>`;
//            if (p.status === "approved") {
//                approvedBox.appendChild(row);
//                approvedCount++;
//            } else if (p.status === "pending") {
//                row.classList.add("pending");
//                row.innerHTML += `
//                    <div class="participant-actions">
//                        <button class="accept">✔</button>
//                        <button class="reject">✖</button>
//                    </div>`;
//                pendingBox.appendChild(row);

//                const userId = p.id;
//                row.querySelector(".accept").addEventListener("click", async () => {
//                    await fetch(`${SERVER_URL}/api/participants/${userId}/accept`, { method: "POST" });
//                    loadParticipants();
//                });
//                row.querySelector(".reject").addEventListener("click", async () => {
//                    await fetch(`${SERVER_URL}/api/participants/${userId}/reject`, { method: "POST" });
//                    loadParticipants();
//                });
//            }
//        });
//        document.getElementById("approvedCount").textContent = approvedCount;
//    } catch (err) { alert(err.message); }
//}

// ---------------- Load Comments ----------------
async function loadComments() {
    try {
        const res = await fetch(`/Post/GetCommentByPostId/${activityId}`);
        if (!res.ok) throw new Error("โหลดคอมเมนต์ไม่สำเร็จ");
        const comments = await res.json();
        console.log("comments: ",comments);

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
    
    if (!text) {
        showToast.warning("กรุณากรอกความคิดเห็น");
        return;
    }

    try {
        await fetch(`/Post/UpdatePost/${activityId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ activityId, text })
        });
        input.value = "";
        showToast.success("ส่งความคิดเห็นสำเร็จ");
         loadComments();
    } catch (err) {
        showToast.error("ไม่สามารถส่งความคิดเห็นได้");
    }
});

// ---------------- Action Buttons ----------------
document.querySelector(".update").addEventListener("click", async () => {
    const title = document.getElementById("activityTitle").value;
    const description = document.getElementById("activityDetails").value;
    const location = document.getElementById("activityPlace").value;
    const date = document.getElementById("activityDeadline").value;
    const tagSelect = document.getElementById("tagSelect");
    const tagId = tagSelect.value;

    if (!title || !description || !location || !date || !tagId) {
        showToast.warning("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
    }

    const data = {
        eventName: title,
        description: description,
        location: location,
        dateOpen: date,
        dateClose: date,
        startTime: "00:00",
        endTime: "23:59",
        maxParticipants: 10,
        status: true,
        tagId: tagId
    };

    try {
        const res = await fetch(`/Post/UpdatePost/${activityId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast.success("อัปเดตกิจกรรมสำเร็จ");
            setTimeout(() => {
                window.location.href = window.ProfileUrl;
            }, 1000);
        } else {
            showToast.error("อัปเดตกิจกรรมล้มเหลว");
        }
    } catch (err) {
        showToast.error("เกิดข้อผิดพลาด: " + err.message);
    }
});


document.querySelector(".leave").addEventListener("click", async () => {
    if (!confirm("คุณต้องการยกเลิกกิจกรรมนี้หรือไม่?")) return;
    
    try {
        await fetch(`${SERVER_URL}/api/activity/${activityId}/leave`, { method: "POST" });
        showToast.success("ยกเลิกกิจกรรมเรียบร้อย");
        setTimeout(() => {
            window.location.href = window.ProfileUrl;
        }, 1000);
    } catch (err) {
        showToast.error("ไม่สามารถยกเลิกได้");
    }
});

document.querySelector(".end").addEventListener("click", async () => {
    if (!confirm("คุณต้องการปิดรับสมัครกิจกรรมนี้หรือไม่?")) return;
    
    try {
        await fetch(`${SERVER_URL}/api/activity/${activityId}/end`, { method: "POST" });
        showToast.success("ปิดรับสมัครเรียบร้อย");
        setTimeout(() => {
            location.reload();
        }, 1000);
    } catch (err) {
        showToast.error("ไม่สามารถปิดรับสมัครได้");
    }
});

// ---------------- Initial Load ----------------
loadActivity();
loadParticipants();
loadComments();