// --------------------------------- Tag หน้า Tags --------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const SERVER_URL = "http://localhost:5122";
  let currentUserId = null;
  let isLoggedIn = false;

  // ---------------- Theme ----------------
  const root = document.documentElement;
  const toggle = document.getElementById("toggle");
  const sunIcon = document.querySelector(".toggle .bxs-sun");
  const moonIcon = document.querySelector(".toggle .bx-moon");

  if(localStorage.getItem("theme") === "dark") {
    root.classList.add("dark");
    toggle.checked = true;
  }

  toggle.addEventListener("change", () => {
    const isDark = root.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    sunIcon.className = isDark ? "bx bx-sun" : "bx bxs-sun";
    moonIcon.className = isDark ? "bx bx-moon" : "bx bxs-moon";
  });

  // ---------------- Sidebar & Hamburger ----------------
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const hamburgerMenu = document.getElementById("hamburgerMenu");
  const menuList = document.getElementById("menuList");
  let menuOpen = false;

  function toggleMenu(open){
    hamburgerMenu.style.display = open ? "block" : "none";
    hamburgerBtn.querySelector("i").className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
  }

  hamburgerBtn.addEventListener("click", () => {
    menuOpen = !menuOpen;
    toggleMenu(menuOpen);
  });

  window.addEventListener("click", e => {
    if(menuOpen && !hamburgerBtn.contains(e.target) && !hamburgerMenu.contains(e.target)){
      toggleMenu(false);
      menuOpen = false;
    }
  });

  function addMenuItem(text, onClick){
    const li = document.createElement("li");
    li.textContent = text;
    li.addEventListener("click", onClick);
    menuList.appendChild(li);
  }

  function updateMenu(){
    menuList.innerHTML = "";
    if(!isLoggedIn){
      addMenuItem("เข้าสู่ระบบ", ()=>window.location.href="/frontend/HTML/login.html");
      addMenuItem("สมัครสมาชิก", ()=>window.location.href="/frontend/HTML/signup.html");
    } else {
      addMenuItem("โปรไฟล์ของฉัน", ()=>window.location.href="/frontend/HTML/profile.html");
      addMenuItem("ออกจากระบบ", async ()=>{
        try{
          await fetch("/Account/Logout",{method:"POST"});
          localStorage.removeItem("userId");
          currentUserId=""; isLoggedIn=false;
          updateMenu();
          alert("ออกจากระบบเรียบร้อย");
        } catch(err){ alert("เกิดข้อผิดพลาด: "+err.message); }
      });
    }
  }
  updateMenu();

  // ---------------- Tag List ----------------
  const tagList = document.querySelector('.tag-list');
  const tagSearchInput = document.getElementById('tagSearchInput');

  async function loadTags(search=""){
    try{
      const res = await fetch(`${SERVER_URL}/tags`);
      const tags = await res.json();
      renderTags(tags, search);
    } 
    catch(err){ console.error(err); tagList.innerHTML="ไม่สามารถโหลดแท็กได้"; }
  }

  function renderTags(tags, search=""){
    if(!tagList) return;
    tagList.innerHTML = "";
    const searchLower = search.toLowerCase();

    tags.forEach(tag => {
      if(search && !tag.name.toLowerCase().includes(searchLower)) return;

      const card = document.createElement("div");
      card.className = "tag-card";
      card.textContent = tag.name;  // ชื่อ tag จาก JSON
      card.addEventListener("click", () => {
        // ไปหน้า Home พร้อม filter tag
        window.location.href = `/Home?tag=${encodeURIComponent(tag.name)}`;
      });

      tagList.appendChild(card);
    });
  }

  if(tagSearchInput){
    tagSearchInput.addEventListener("input", e=>{
      loadTags(e.target.value.trim());
    });
  }

  // ---------------- Notification ----------------
  // ====== Notification Dot ======
const notifyDot = document.querySelector('.notify-dot');
const notifyLink = document.querySelector('.notify-link');

async function checkNotification() {
  if (!notifyDot || !isLoggedIn) return;
  try {
    const res = await fetch("/Notify/Latest");
    const notifications = await res.json();
    if (notifications.length === 0) {
      notifyDot.style.display = "none";
      return;
    }
    // notification ใหม่สุดอยู่ index 0
    const latestId = notifications[0].notification_id;
    const lastReadId = Number(sessionStorage.getItem("lastReadNotificationId") || 0);

    if (latestId > lastReadId) {
      notifyDot.style.display = "block";
    } else {
      notifyDot.style.display = "none";
    }
  } catch (e) {
    notifyDot.style.display = "none";
  }
}

if (notifyLink) {
  notifyLink.addEventListener("click", async () => {
    try {
      const res = await fetch("/Notify/Latest");
      const notifications = await res.json();
      if (notifications.length > 0) {
        sessionStorage.setItem("lastReadNotificationId", notifications[0].notification_id);
      }
      notifyDot.style.display = "none";
    } catch (e) {}
  });
}

setInterval(checkNotification, 5000);

checkNotification();
   loadTags();

  // ---------------- Session Data ----------------
  const response = await fetch('/Profile/GetSessionData');
  const data = await response.json();
  currentUserId = data.userId || null;
  isLoggedIn = data.isLoggedIn || false;
});
