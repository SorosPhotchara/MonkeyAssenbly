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
const SERVER_URL = "http://localhost:5122";
const currentUserId = localStorage.getItem("userId");
const urlParams = new URLSearchParams(window.location.search);
const activityId = document.body.dataset.postId;

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
        console.log(data.post.participants);
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


        // Render participants (approved)
        const approvedBox = document.getElementById("approvedBox");
        approvedBox.querySelectorAll(".participant-row").forEach(e => e.remove());
        let approvedCount = 0;
        if (Array.isArray(data.post.participants)) {
            data.post.participants.forEach(p => {
                const row = document.createElement("div");
                row.className = "participant-row";
                row.innerHTML = `<img src="${p.avatar}" alt="avatar" class="participant-avatar" style="width:32px;height:32px;border-radius:50%;margin-right:8px;object-fit:cover;"> <span>${p.name}</span>`;
                approvedBox.appendChild(row);
                approvedCount++;
            });
        }
        document.getElementById("approvedCount").textContent = approvedCount;
    } catch (err) {
        showToast.error(err.message);
        console.error("❌ ERROR:", err);
    }
}


// ---------------- Load Participants ----------------
async function loadParticipants() {
    // ไม่ต้องโหลด participants แยกแล้ว เพราะใช้จาก data.post.participants ใน loadActivity()
    return;
}

// ---------------- Load Comments ----------------
//async function loadComments() {
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
async function loadComments(activityId) {
    const commentList = document.getElementById("commentList");
    commentList.innerHTML = "<p>กำลังโหลด...</p>";
    try {
        const response = await fetch(`/Post/GetComments?postId=${activityId}`);
        if (!response.ok) throw new Error("ไม่สามารถโหลด comments ได้");

        const comments = await response.json();
        commentList.innerHTML = "";

        if (comments.length === 0) {
            commentList.innerHTML = "<p style='text-align:center; color:var(--sub-font); padding:20px;'>ยังไม่มีความคิดเห็น</p>";
        } else {
            comments.forEach(comment => {
                const commentDiv = document.createElement("div");
                commentDiv.className = "comment-item";
                commentDiv.innerHTML = `
            <div class="comment-user">${comment.userName}</div>
            <div class="comment-text">${comment.text}</div>
            <div class="comment-time">${comment.createdAt}</div>
          `;
                commentList.appendChild(commentDiv);
            });
        }

        commentList.scrollTop = commentList.scrollHeight;

    } catch (error) {
        console.error("Error loading comments:", error);
        commentList.innerHTML = "<p style='color:red;'>เกิดข้อผิดพลาดในการโหลด comments</p>";
        showToast.error("ไม่สามารถโหลดความคิดเห็นได้");
    }
}

// ---------------- Send Comment ----------------
document.getElementById("sendComment").addEventListener("click", async () => {
    const input = document.getElementById("commentInput");
    const text = input.value.trim();
    //console.log("currentUserId : ", currentUserId);

    const getSessionData = async () => {
        try {
            const res = await fetch("/Profile/GetSessionData", {
                method: "GET",
                credentials: "same-origin"
            });

            const data = await res.json();
            if (data.isLoggedIn) {
                console.log("Session:", data);
                return data;  // ✅ ส่งข้อมูลออกไป
            } else {
                console.log("ยังไม่ได้ล็อกอิน");
                return null;
            }
        } catch (err) {
            console.error("Error fetching session:", err);
            return null;
        }
    };
    //const new_user_id = session?.userId;
    //console.log("new_user_id", new_user_id);


    if (!text) {
        showToast.warning("กรุณากรอกความคิดเห็น");
        return;
    }
    //const session = getSessionData();
    const session = await getSessionData();
    if (!session) return;
    try {
        //console.log("Sending comment:", {
        //    postId: activityId,
        //    userId: session.userId,
        //    text: text
        //});
        const act_id = parseInt(activityId)
        const res = await fetch(`/Post/AddCommentFromHost`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                postId: act_id,
                userId: session.userId,
                text: text
            })
        });

        if (!res.ok) throw new Error("ส่งความคิดเห็นล้มเหลว");

        input.value = "";
        showToast.success("ส่งความคิดเห็นสำเร็จ");
        loadComments(activityId); // ✅ โหลด comment ใหม่
    } catch (err) {
        console.error(err);
        showToast.error("ไม่สามารถส่งความคิดเห็นได้");
    }
});


// ---------------- Action Buttons ----------------
document.querySelector(".update").addEventListener("click", async () => {
    const new_title = document.getElementById("activityTitle").value;
    const new_description = document.getElementById("activityDetails").value;
    const new_location = document.getElementById("activityPlace").value;
    const new_enddate = document.getElementById("activityDeadline").value;
    const new_tagSelect = document.getElementById("tagSelect");
    const new_tagId = new_tagSelect.value;
    let new_status = false;
    const old_res = await fetch(`/Post/GetPostById/${activityId}`);
    if (!old_res) { return false };
    
    const old_data = await old_res.json();
    console.log("old data : ",old_data);


    if (!new_title || !new_description || !new_location || !new_enddate || !new_tagId) {

        showToast.warning("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
    }
    console.log("new_tagId:", new_tagId);
    if (old_data.post.status === "open") {
        new_status = true;
    }

    const data = {
        eventName: new_title,
        description: new_description,
        location: new_location,
        dateOpen: old_data.post.dateOpen,
        dateClose: new_enddate,
        startTime: old_data.post.startTime,
        endTime: old_data.post.endTime,
        maxParticipants: old_data.post.maxParticipants,
        status: new_status,
        tagId: parseInt(new_tagId)
    };
    console.log(data);


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
    // if (!confirm("คุณต้องการยกเลิกกิจกรรมนี้หรือไม่?")) return;
    window.location.href = window.ProfileUrl;
    // try {
    //     await fetch(`${SERVER_URL}/api/activity/${activityId}/leave`, { method: "POST" });
    //     showToast.success("ยกเลิกกิจกรรมเรียบร้อย");
    //     setTimeout(() => {
    //         window.location.href = window.ProfileUrl;
    //     }, 1000);
    // } catch (err) {
    //     showToast.error("ไม่สามารถยกเลิกได้");
    // }
});

document.querySelector(".end").addEventListener("click", async () => {
    // สร้าง Modal Popup
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box">
            <div class="modal-icon">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div class="modal-title">ยืนยันการปิดรับสมัคร</div>
            <div class="modal-message">คุณต้องการปิดรับสมัครกิจกรรมนี้หรือไม่?<br>การกระทำนี้ไม่สามารถยกเลิกได้</div>
            <div class="modal-actions">
                <button class="modal-cancel" id="modalCancel">ยกเลิก</button>
                <button class="modal-confirm" id="modalConfirm">ยืนยัน</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // ปุ่มยกเลิก
    document.getElementById('modalCancel').addEventListener('click', () => {
        modal.remove();
    });
    
    // ปุ่มยืนยัน
    document.getElementById('modalConfirm').addEventListener('click', async () => {
        modal.remove();
        
        try {
            const res = await fetch(`/Post/EndPost/${activityId}`, { method: "PATCH" });
            if (res.ok) {
                showToast.success("ปิดรับสมัครเรียบร้อย");
                setTimeout(() => {
                    window.location.href = window.ProfileUrl;
                }, 1000);
            } else {
                showToast.error("ไม่สามารถปิดรับสมัครได้");
            }
        } catch (err) {
            showToast.error("เกิดข้อผิดพลาด: " + err.message);
        }
    });
    
    // คลิกนอก modal เพื่อปิด
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
});

// ---------------- Initial Load ----------------
loadActivity();
loadComments(activityId);
//loadParticipants();