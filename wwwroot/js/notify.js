document.addEventListener("DOMContentLoaded", () => {
  const SERVER_URL = "http://localhost:3000"; // backend URL
  const notifyList = document.querySelector('.notify-list');
  const currentUserId = localStorage.getItem("userId") || "";
  const isLoggedIn = !!currentUserId;

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
    sunIcon.className = isDark ? "bx bx-sun" : "bxs-sun";
    moonIcon.className = isDark ? "bx bx-moon" : "bxs-moon";
  });

  // ---------------- Sidebar & Hamburger ----------------
  const sidebarLinks = document.querySelectorAll(".sidebar a");
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
      addMenuItem("เข้าสู่ระบบ", ()=>window.location.href=window.LoginUrl);
      addMenuItem("สมัครสมาชิก", ()=>window.location.href=window.SignupUrl);
    } else {
      addMenuItem("โปรไฟล์ของฉัน", ()=>window.location.href=window.ProfileUrl);
      addMenuItem("ออกจากระบบ", async ()=>{
        try{
          await fetch("/Account/Logout",{method:"POST"});
          localStorage.removeItem("userId");
          window.location.reload();
        } catch(err){ alert("เกิดข้อผิดพลาด: "+err.message); }
      });
    }
  }
  updateMenu();

  // ---------------- Notification ----------------
  async function loadNotifications(){
    if(!notifyList) return;

    // ไม่ต้องเช็ค login ถ้าไม่จำเป็น
    notifyList.innerHTML = "กำลังโหลด...";

    try{
      const res = await fetch("/Notify/Latest");
      const notifications = await res.json(); // [{type, message, time}, ...]
      if(!notifications || notifications.length === 0){
        notifyList.innerHTML = "<p class='notify-empty'>ไม่มีแจ้งเตือน</p>";
        return;
      }
      renderNotifications(notifications);
    } catch(err){
      notifyList.innerHTML = "ไม่สามารถโหลดแจ้งเตือนได้";
      console.error(err);
    }
  }

  function renderNotifications(notifications){
    notifyList.innerHTML = "";
    notifications.forEach(item => {
      let icon = "";
      if(item.type === "comment") icon = "💬";
      else if(item.type === "join") icon = "👤";
      else if(item.type === "full") icon = "⚠️";
      const notifyItem = document.createElement('div');
      notifyItem.className = 'notify-item';
      notifyItem.innerHTML = `
        <span class="notify-icon">${icon}</span>
        <span class="notify-msg">${item.message}</span>
        <span class="notify-time">${item.time}</span>
      `;
      notifyList.appendChild(notifyItem);
    });
  }

  // โหลดซ้ำทุก 1 นาที
  setInterval(loadNotifications, 60000);
  loadNotifications();
});