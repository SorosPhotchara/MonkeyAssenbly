// common.js

document.addEventListener("DOMContentLoaded", () => {
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const hamburgerMenu = document.getElementById("hamburgerMenu");
    const menuList = document.getElementById("menuList");

    if (!hamburgerBtn || !hamburgerMenu || !menuList) {
        console.warn("Hamburger menu elements not found on this page.");
        return;
    }

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
                credentials: "same-origin"
            });
            const data = await res.json();
            console.log("CheckLoginStatus:", data);

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

    // toggle menu open/close
    let menuOpen = false;
    const toggleMenu = open => {
        hamburgerMenu.style.display = open ? "block" : "none";
        hamburgerBtn.querySelector("i").className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
    };

    hamburgerBtn.addEventListener("click", () => {
        menuOpen = !menuOpen;
        toggleMenu(menuOpen);
    });

    window.addEventListener("click", e => {
        if (menuOpen && !hamburgerBtn.contains(e.target) && !hamburgerMenu.contains(e.target)) {
            toggleMenu(false);
            menuOpen = false;
        }
    });

    // เรียกตรวจสอบเมนูตอนโหลดหน้า
    updateMenu();
});
