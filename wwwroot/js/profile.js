// =================== Theme Toggle ===================
const root = document.documentElement;
const toggle = document.getElementById("toggle");
const sunIcon = document.querySelector(".toggle .bxs-sun");
const moonIcon = document.querySelector(".toggle .bx-moon");

if (localStorage.getItem("theme") === "dark") {
    root.classList.add("dark");
    toggle.checked = true;
}

toggle.addEventListener("change", () => {
    const isDark = root.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    sunIcon.className = isDark ? "bx bx-sun" : "bx bxs-sun";
    moonIcon.className = isDark ? "bx bx-moon" : "bx bxs-moon";
});

// =================== Sidebar Menu ===================
document.querySelectorAll(".menu h2").forEach(item => {
    item.addEventListener("click", () => {
        document.querySelectorAll(".menu h2").forEach(el => el.classList.remove("active"));
        item.classList.add("active");
    });
});

const sidebarLinks = document.querySelectorAll(".sidebar a");
sidebarLinks.forEach((link, index) => {
    link.addEventListener("click", e => {
        e.preventDefault();
        sidebarLinks.forEach(el => el.classList.remove("active"));
        link.classList.add("active");

        switch(index) {
            case 0: window.location.href=window.HomeUrl; break;
            case 1: window.location.href = window.TagsUrl; break;
            case 2: 
                if(typeof modal !== "undefined") {
                    modal.style.display="flex"; 
                    textarea?.focus();
                }
                break;
            case 3: window.location.href =window.NotifyUrl; break;
            case 4: window.location.href = window.ProfileUrl; break; 
        }
    });
});

// =================== Hamburger Menu ===================
let isLoggedIn = localStorage.getItem("isLoggedIn") === "true"; 
const hamburgerBtn = document.getElementById("hamburgerBtn");
const hamburgerMenu = document.getElementById("hamburgerMenu");
const menuList = document.getElementById("menuList");

const addMenuItem = (text, onClick) => {
    const li = document.createElement("li");
    li.textContent = text;
    li.addEventListener("click", onClick);
    menuList.appendChild(li);
};

const updateMenu = () => {
    menuList.innerHTML = "";
    if(!isLoggedIn){
        addMenuItem("เข้าสู่ระบบ", ()=>window.location.href="/frontend/HTML/login.html");
        addMenuItem("สมัครสมาชิก", ()=>window.location.href="/frontend/HTML/signup.html");
    } else {
        addMenuItem("โปรไฟล์ของฉัน", ()=>window.location.href="/frontend/HTML/profile.html");
        addMenuItem("ออกจากระบบ", async ()=>{
            try{
                await fetch("/Account/Logout",{method:"POST"});
                setLoginState(false);
                alert("ออกจากระบบเรียบร้อย");
            } catch(err){ alert("เกิดข้อผิดพลาด: "+err.message); }
        });
    }
};

const setLoginState = state => {
    isLoggedIn = state;
    localStorage.setItem("isLoggedIn", state);
    updateMenu();
};

let menuOpen = false;
const toggleMenu = open => {
    hamburgerMenu.style.display = open ? "block" : "none";
    hamburgerBtn.querySelector("i").className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
};

hamburgerBtn.addEventListener("click", ()=>{
    menuOpen = !menuOpen;
    toggleMenu(menuOpen);
});

window.addEventListener("click", e=>{
    if(menuOpen && !hamburgerBtn.contains(e.target) && !hamburgerMenu.contains(e.target)){
        toggleMenu(false);
        menuOpen = false;
    }
});

updateMenu();

// =================== Profile Page (Edit + Follow) ===================
document.addEventListener("DOMContentLoaded", () => {
    const editBtn = document.getElementById("edit-btn");
    const followBtn = document.getElementById("follow-btn");
    const editModal = document.querySelector(".modal");
    const cancelBtn = document.querySelector(".btn-cancel");
    const saveBtn = document.querySelector(".btn-save");
    const usernameInput = document.getElementById("username");
    const bioInput = document.getElementById("bio");
    const fileUpload = document.getElementById("file-upload");

    const profileUsername = document.getElementById("profile-username");
    const profileBio = document.getElementById("profile-bio");
    const profilePic = document.getElementById("profile-pic");
    const followersCount = document.getElementById("followers-count");
    const followingCount = document.getElementById("following-count");

    const userId = document.body.dataset.userId;
    const role = document.body.dataset.role;

    // ================== Fetch profile info from backend ==================
    const loadProfile = async () => {
        try {
            const res = await fetch(`/api/profile/${userId}`);
            if(!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
            const data = await res.json();

            profileUsername.textContent = data.username;
            profileBio.textContent = data.bio;
            profilePic.src = data.avatar || "/uploads/default-avatar.png";
            followersCount.textContent = data.followers;
            followingCount.textContent = data.following;

            if(role === "visitor") {
                editBtn?.classList.add("hidden");
                followBtn?.classList.remove("hidden");
                followBtn.textContent = data.isFollowing ? "Unfollow" : "Follow";
                if(data.isFollowing) followBtn.classList.add("following");
            } else {
                followBtn?.classList.add("hidden");
                editBtn?.classList.remove("hidden");
            }
        } catch(err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการโหลดโปรไฟล์");
        }
    };

    loadProfile();

    // ================== Edit Profile ==================
    editBtn?.addEventListener("click", () => {
        editModal.classList.add("show");
        usernameInput.value = profileUsername.textContent;
        bioInput.value = profileBio.textContent;
    });

    cancelBtn?.addEventListener("click", () => editModal.classList.remove("show"));
    editModal.addEventListener("click", e => {
        if(e.target === editModal) editModal.classList.remove("show");
    });

    saveBtn?.addEventListener("click", async () => {
        const formData = new FormData();
        formData.append("username", usernameInput.value);
        formData.append("bio", bioInput.value);
        if(fileUpload.files.length > 0){
            formData.append("avatar", fileUpload.files[0]);
        }

        try {
            const res = await fetch(`/api/profile/${userId}`, {
                method: "PUT",
                body: formData
            });
            if(!res.ok) throw new Error("ไม่สามารถบันทึกได้");

            const data = await res.json();
            profileUsername.textContent = data.username;
            profileBio.textContent = data.bio;
            if(data.avatar) profilePic.src = data.avatar;

            editModal.classList.remove("show");
            alert("บันทึกข้อมูลเรียบร้อยแล้ว");
        } catch(err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด: "+err.message);
        }
    });

    // ================== Follow / Unfollow ==================
    followBtn?.addEventListener("click", async () => {
        try {
            const action = followBtn.textContent === "Follow" ? "follow" : "unfollow";
            const res = await fetch(`/api/profile/${userId}/${action}`, {method: "POST"});
            if(!res.ok) throw new Error("ไม่สามารถอัปเดต follow status");

            const data = await res.json();
            followBtn.textContent = data.isFollowing ? "Unfollow" : "Follow";
            followBtn.classList.toggle("following", data.isFollowing);
            followersCount.textContent = data.followers;
        } catch(err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด: "+err.message);
        }
    });

    // ================== Tabs ==================
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));

            tab.classList.add("active");
            document.getElementById(tab.dataset.tab).classList.add("active");
        });
    });

    // ================== Post Menu (Host Only) ==================
    const posts = document.querySelectorAll(".post-card");

    posts.forEach(post => {
        const dropdown = post.querySelector(".post-menu-dropdown");
        const menuBtn = post.querySelector(".post-menu");

        if(role === "visitor" && post.dataset.private === "true") {
            post.style.display = "none";
        }

        if(role === "host") {
            dropdown.innerHTML = `
                <li class="menu-private">Private</li>
                <li class="menu-edit">Edit</li>
                <li class="menu-delete">Delete</li>
            `;

            menuBtn.addEventListener("click", e => {
                e.stopPropagation();
                dropdown.classList.toggle("show");
            });

            // Private
            dropdown.querySelector(".menu-private").addEventListener("click", async () => {
                try {
                    const postId = post.dataset.postId;
                    const res = await fetch(`/api/posts/${postId}/private`, {method:"POST"});
                    if(!res.ok) throw new Error("ไม่สามารถตั้ง private");

                    post.dataset.private = "true";
                    alert("โพสต์นี้ถูกตั้งเป็น Private");
                    dropdown.classList.remove("show");
                } catch(err) {
                    console.error(err);
                    alert(err.message);
                }
            });

            // Edit
            dropdown.querySelector(".menu-edit").addEventListener("click", () => {
                const postId = post.dataset.postId;
                window.location.href = `/frontend/HTML/detailhost.html?id=${postId}`;
            });

            // Delete
            dropdown.querySelector(".menu-delete").addEventListener("click", async () => {
                if(!confirm("คุณแน่ใจว่าต้องการลบโพสต์นี้?")) return;
                try {
                    const postId = post.dataset.postId;
                    const res = await fetch(`/api/posts/${postId}`, {method:"DELETE"});
                    if(!res.ok) throw new Error("ลบโพสต์ไม่สำเร็จ");

                    post.remove();
                    alert("ลบโพสต์เรียบร้อย");
                } catch(err) {
                    console.error(err);
                    alert(err.message);
                }
            });
        }
    });

    window.addEventListener("click", () => {
        document.querySelectorAll(".post-menu-dropdown").forEach(d => d.classList.remove("show"));
    });
});
