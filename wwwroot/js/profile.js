document.addEventListener("DOMContentLoaded", () => {
    const SERVER_URL = "http://localhost:3000";
    const TIMEZONE = "Asia/Bangkok";
    let currentUserId = localStorage.getItem("userId") || "";
    let isLoggedIn = !!currentUserId;

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

    const updateMenu = async () => {
        try {
            const res = await fetch("/Profile/CheckLoginStatus", {
                method: "GET",
                credentials: "same-origin"  // ต้องใส่เพื่อส่ง cookie session
            });
            const data = await res.json();

            // 🟢 Debug จุดสำคัญ
            console.log("CheckLoginStatus:", data); 
            console.log("menuList element:", menuList);

            menuList.innerHTML = "";

            if (data.isLoggedIn) {
                addMenuItem("โปรไฟล์ของฉัน", () => window.location.href = window.ProfileUrl);
                addMenuItem("ออกจากระบบ", async () => {
                    await fetch("/Login/Logout", {
                        method: "POST",
                        credentials: "same-origin"
                    });
                    window.location.href = window.LoginUrl;
                });
            } else {
                addMenuItem("Log in", () => window.location.href = window.LoginUrl);
                addMenuItem("Sign up", () => window.location.href = window.SignupUrl);
            }
        } catch (err) {
            console.error("Error checking login status:", err);
        }
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
            if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
            const data = await res.json();

            // แยกชื่อเต็มออกเป็น first และ last
            const fullName = data.username.split(" ");
            document.getElementById("first-name").value = fullName[0] || "";
            document.getElementById("last-name").value = fullName[1] || "";
            const avatarInput = document.getElementById("avatar-url");

            profileUsername.textContent = data.username;
            profileBio.textContent = data.bio;
            profilePic.src = data.avatar ;
            avatarInput.value = data.avatar ;

            followersCount.textContent = data.followers;
            followingCount.textContent = data.following;
        } catch (err) {
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
        const firstName = document.getElementById("first-name").value.trim();
        const lastName = document.getElementById("last-name").value.trim();

        if (!firstName || !lastName) {
            alert("กรุณากรอกชื่อและนามสกุล");
            return;
        }

        try {
            const res = await fetch(`/Profile/UpdateProfile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    bio: bio,
                    avatarUrl: avatarUrl
                })
            });

            if (!res.ok) throw new Error("ไม่สามารถบันทึกได้");
            const data = await res.json();

            profileUsername.textContent = data.username;
            profileBio.textContent = data.bio;
            profilePic.src = data.avatar;
            // alert("บันทึกข้อมูลเรียบร้อยแล้ว");
            editModal.classList.remove("show");
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
            tabs.forEach(t => t.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));

            tab.classList.add("active");
            const target = document.getElementById(tab.dataset.tab);
            if(target) target.classList.add("active");
        });
    });
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

    // -------- Load Posts & History --------
    const loadYourPosts = async () => {
        const session = await getSessionData();
        if (!session) return;
        console.log("useridddd",session.userId);
        //const res = await fetch(`GetMyPost/${session.userId}`);
         //console.log(res);
        try {
            const res = await fetch(`/Post/GetMyPost/${session.userId}`);
            if (!res.ok) throw new Error("ไม่สามารถโหลดโพสต์ได้");
            const posts = await res.json();
            const container = document.getElementById("your-posts");
            
            if (posts.length === 0) {
                console.log(currentUserId);
                container.innerHTML = "<p>คุณยังไม่มีโพสต์</p>";
                return;
            }

            container.innerHTML = "";
            console.log("User posts:", posts);
            console.log("Fetching my post:", currentUserId);

            posts.forEach(p => {
                const div = document.createElement("div");
                div.className = "post-item";
                div.innerHTML = `
                    <h4>${p.eventName}</h4>
                    <p>${p.description}</p>
                    <small>${new Date(p.dateOpen).toLocaleString("th-TH")}</small>
                `;
                container.appendChild(div);
            });
        } catch (err) {
            console.error(err);
            document.getElementById("your-posts").innerHTML = "<p>เกิดข้อผิดพลาดในการโหลดโพสต์</p>";
        }
    };

    //const loadHistory = async () => {
    //    try {
    //        const res = await fetch(`/Profile/GetHistory`);
    //        if (!res.ok) throw new Error("ไม่สามารถโหลดประวัติได้");
    //        const history = await res.json();
    //        const container = document.getElementById("history");

    //        if(history.length === 0){
    //            container.innerHTML = "<p>คุณยังไม่มีประวัติการเข้าร่วม</p>";
    //            return;
    //        }

    //        container.innerHTML = "";
    //        history.forEach(h => {
    //            const div = document.createElement("div");
    //            div.className = "history-item";
    //            div.innerHTML = `
    //                <p>${h.event}</p>
    //                <small>${new Date(h.date).toLocaleString("th-TH")}</small>
    //            `;
    //            container.appendChild(div);
    //        });
    //    } catch (err) {
    //        console.error(err);
    //        document.getElementById("history").innerHTML = "<p>เกิดข้อผิดพลาดในการโหลดประวัติ</p>";
    //    }
    //};

    loadYourPosts();
    //loadHistory();

    updateMenu();
});
