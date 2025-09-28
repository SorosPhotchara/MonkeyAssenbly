document.addEventListener("DOMContentLoaded", () => {
    // ---------------- Theme Toggle ----------------
    const root = document.documentElement;
    const toggle = document.getElementById("toggle");
    const sunIcon = document.querySelector(".toggle .bxs-sun");
    const moonIcon = document.querySelector(".toggle .bx-moon");

    if (localStorage.getItem("theme") === "dark") {
        root.classList.add("dark");
        toggle.checked = true;
    }

    toggle?.addEventListener("change", () => {
        const isDark = root.classList.toggle("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        sunIcon.className = isDark ? "bx bx-sun" : "bxs-sun";
        moonIcon.className = isDark ? "bx bx-moon" : "bxs-moon";
    });

    // ---------------- Sidebar Menu ----------------
    const sidebarLinks = document.querySelectorAll(".sidebar a");
    sidebarLinks.forEach((link, index) => {
        link.addEventListener("click", e => {
            if(index === 2) e.preventDefault(); // ปุ่ม "+" เปิด modal

            sidebarLinks.forEach(el => el.classList.remove("active"));
            link.classList.add("active");

            switch(index) {
                case 0: window.location.href = window.HomeUrl; break;
                case 1: window.location.href = window.TagsUrl; break;
                case 2: 
                    const modal = document.querySelector(".modal");
                    const textarea = document.querySelector("textarea");
                    if(modal){
                        modal.style.display="flex"; 
                        textarea?.focus();
                    }
                    break;
                case 3: window.location.href = window.NotifyUrl; break;
                case 4: window.location.href = window.ProfileUrl; break; 
            }
        });
    });

    // ---------------- Hamburger Menu ----------------
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
        addMenuItem("โปรไฟล์ของฉัน", () => window.location.href = window.ProfileUrl);
        addMenuItem("ออกจากระบบ", async ()=> {
            try{
                await fetch("/Login/Logout", { method: "POST" });
                window.location.href = window.LoginUrl;
            } catch(err){ alert("เกิดข้อผิดพลาด: "+err.message); }
        });
    };

    let menuOpen = false;
    const toggleMenu = open => {
        hamburgerMenu.style.display = open ? "block" : "none";
        hamburgerBtn.querySelector("i").className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
    };

    hamburgerBtn?.addEventListener("click", ()=> {
        menuOpen = !menuOpen;
        toggleMenu(menuOpen);
    });

    window.addEventListener("click", e => {
        if(menuOpen && !hamburgerBtn.contains(e.target) && !hamburgerMenu.contains(e.target)){
            toggleMenu(false);
            menuOpen = false;
        }
    });

    updateMenu();

    // ---------------- Profile Page ----------------
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

    // -------- Load Profile Info --------
    const loadProfile = async () => {
        try {
            const res = await fetch(`/Profile/GetProfile`);
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
                followBtn.classList.toggle("following", data.isFollowing);
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

    // -------- Edit Profile --------
    editBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        if(role === "visitor"){ window.location.href = window.LoginUrl; return; }
        editModal.classList.add("show");
        usernameInput.value = profileUsername.textContent;
        bioInput.value = profileBio.textContent;
    });

    cancelBtn?.addEventListener("click", (e) => { e.preventDefault(); editModal.classList.remove("show"); });
    editModal?.addEventListener("click", e => { if(e.target===editModal) editModal.classList.remove("show"); });

    saveBtn?.addEventListener("click", async (e) => {
        e.preventDefault();
        const avatarUrl = document.getElementById("avatar-url").value.trim();
        const bio = bioInput.value.trim();
        const username = usernameInput.value.trim();

        if (!avatarUrl) {
            alert("กรุณาใส่ URL รูปภาพ");
            return;
        }

        try {
            const res = await fetch(`/Profile/UpdateProfile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarUrl, bio, username })
            });

            if (!res.ok) throw new Error("ไม่สามารถบันทึกได้");
            const data = await res.json();

            profilePic.src = data.avatar;
            profileBio.textContent = data.bio;
            profileUsername.textContent = data.username;
            alert("บันทึกข้อมูลเรียบร้อยแล้ว");
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด: " + err.message);
        }
    });

    // -------- Follow / Unfollow --------
    followBtn?.addEventListener("click", async (e) => {
        e.preventDefault();
        if(role === "visitor"){ window.location.href = window.LoginUrl; return; }
        try{
            const action = followBtn.textContent==="Follow" ? "follow" : "unfollow";
            const res = await fetch(`/api/profile/${userId}/${action}`, {method:"POST"});
            if(!res.ok) throw new Error("ไม่สามารถอัปเดต follow status");
            const data = await res.json();
            followBtn.textContent = data.isFollowing?"Unfollow":"Follow";
            followBtn.classList.toggle("following", data.isFollowing);
            followersCount.textContent = data.followers;
        } catch(err){
            console.error(err);
            alert("เกิดข้อผิดพลาด: "+err.message);
        }
    });

    // -------- Tabs Toggle --------
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            e.preventDefault();
            tabs.forEach(t=>t.classList.remove("active"));
            tabContents.forEach(c=>c.classList.remove("active"));

            tab.classList.add("active");
            const target = document.getElementById(tab.dataset.tab);
            if(target) target.classList.add("active");
        });
    });
});
