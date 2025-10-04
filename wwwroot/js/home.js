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

document.addEventListener("DOMContentLoaded", async () => {
  const TIMEZONE = "Asia/Bangkok";
  const addBtn = document.querySelector(".sidebar .add"); 
  const createEventModal = document.getElementById("createEventModal");
  const closeModalBtn = document.querySelector(".close-btn");
  
  // ==================== เช็ค LOGIN จาก SESSION START ====================
  const response = await fetch('/Profile/GetSessionData');
  const data = await response.json();
  
  let currentUserId = data.userId || null;
  let isLoggedIn = data.isLoggedIn || false;
  let currentUserName = data.isLoggedIn ? `${data.firstName} ${data.lastName}` : "";
  
  console.log("📋 Login Status:", isLoggedIn ? "✅ Logged in" : "❌ Not logged in");
  console.log("👤 User ID:", currentUserId, "Name:", currentUserName);
  // ==================== เช็ค LOGIN จาก SESSION END ====================

  // ---------------- Theme ----------------
  const root = document.documentElement;
  const toggle = document.getElementById("toggle");
  const sunIcon = document.querySelector(".toggle .bxs-sun");
  const moonIcon = document.querySelector(".toggle .bx-moon");
  if (localStorage.getItem("theme")==="dark"){ root.classList.add("dark"); toggle.checked=true; }
  toggle.addEventListener("change", () => {
    const isDark = root.classList.toggle("dark");
    localStorage.setItem("theme", isDark?"dark":"light");
    sunIcon.className = isDark?"bx bx-sun":"bx bxs-sun";
    moonIcon.className = isDark?"bx bx-moon":"bx bxs-moon";
  });

  // ---------------- Sidebar Tabs ----------------
  document.querySelectorAll(".menu h2").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".menu h2").forEach(el=>el.classList.remove("active"));
      item.classList.add("active");
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      document.getElementById(item.dataset.tab).classList.add("active");
      renderEventsCache();
    });
  });

  // ---------------- Hamburger ----------------
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const hamburgerMenu = document.getElementById("hamburgerMenu");
  const menuList = document.getElementById("menuList");
  let menuOpen=false;
  const toggleMenu = open=>{
    hamburgerMenu.style.display=open?"block":"none";
    hamburgerBtn.querySelector("i").className=open?"fa-solid fa-xmark":"fa-solid fa-bars";
  };
  hamburgerBtn.addEventListener("click", ()=>{ menuOpen=!menuOpen; toggleMenu(menuOpen); });
  window.addEventListener("click", e=>{
    if(menuOpen && !hamburgerBtn.contains(e.target) && !hamburgerMenu.contains(e.target)){
      toggleMenu(false); menuOpen=false;
    }
  });

  // ---------------- Sidebar Menu Items ----------------
  const addMenuItem = (text,onClick)=>{ 
    const li=document.createElement("li"); 
    li.textContent=text; 
    li.addEventListener("click", onClick); 
    menuList.appendChild(li); 
  };
  
  const updateMenu = ()=>{
    menuList.innerHTML="";
    if(!isLoggedIn){
        addMenuItem("เข้าสู่ระบบ", () => window.location.href = window.LoginUrl);
        addMenuItem("สมัครสมาชิก",()=>window.location.href= window.SignupUrl);
    } else {
        addMenuItem("โปรไฟล์ของฉัน", () => window.location.href = window.ProfileUrl);
        addMenuItem("ออกจากระบบ", async ()=>{
          try{
            await fetch("/Account/Logout",{method:"POST"});
            localStorage.removeItem("userId");
            showToast.success("ออกจากระบบเรียบร้อย");
            setTimeout(() => location.reload(), 1000);
            } catch(err){ showToast.error("เกิดข้อผิดพลาด: "+err.message); }
        });
    }
  };
  updateMenu();

  // ---------------- Create Event Modal ----------------
  addBtn.addEventListener("click", (e) => {
    e.preventDefault(); 
    createEventModal.style.display = "flex";
  });

  closeModalBtn.addEventListener("click", () => {
    createEventModal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === createEventModal) {
      createEventModal.style.display = "none";
    }
  });

  // ---------------- Event Feed ----------------
  const forYouFeed = document.getElementById("for-you");
  const followFeed = document.getElementById("follow");
  let cachedEvents=[];

  const urlParams = new URLSearchParams(window.location.search);
  const tagQuery = urlParams.get("tag");

  async function loadEventsByTag(tag){
    try{
      let res;
      if(tag){
        res = await fetch(`/Post/GetPostsByTag?tag=${encodeURIComponent(tag)}`);
      } else {
        res = await fetch(`/Post/GetAllPost`);
      }
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
      cachedEvents = await res.json();
      renderEventsCache();
    } catch(err){
      console.error("Error fetching events:", err);
      showToast.error("ไม่สามารถโหลดข้อมูลได้");
      cachedEvents = [];
      renderEventsCache();
    }
  }

  function isUserJoined(participants) {
    if (!participants || !currentUserId) return false;
    return participants.some(p => String(p) === String(currentUserId));
  }

  function renderEventsCache(){
     forYouFeed.innerHTML=""; 
     followFeed.innerHTML="";
    cachedEvents.forEach(event => {
      const cardForYou = createEventCard(event);
      forYouFeed.appendChild(cardForYou);
      if (isLoggedIn && event.hostsFollowing && event.hostsFollowing.includes(currentUserId)) {
        const cardFollow = createEventCard(event, true);
        followFeed.appendChild(cardFollow);
      }
    });
  }

  function createEventCard(eventData) {
    const card = document.createElement("div");
    card.className = "event-card";
    card.dataset.eventId = eventData.id;
    const status = updatePostStatus(eventData);
    const avatarHTML = `<img src="${eventData.avatar}" alt="avatar" class="avatar">`;
    const isJoined = isUserJoined(eventData.participants);

    card.innerHTML = `
      <div class="event-header">
        <div class="host-info">
          ${avatarHTML}
          <span class="host">${eventData.host}</span>
          <small class="time">0 นาที</small>
        </div>
        <span class="status ${status}">${status.toUpperCase()}</span>
      </div>
      <div class="event-body">
        <h3>${eventData.eventName}</h3>
        <p>${eventData.description}</p>
        <small>สถานที่: ${eventData.location || "ไม่ระบุ"}</small><br>
        <small>เวลาเปิดรับ: ${eventData.startTime || ""} - ${eventData.endTime || ""}</small><br>
        <small>วันที่: ${eventData.dateOpen || ""} ถึง ${eventData.dateClose || ""}</small><br>
        <small>ผู้เข้าร่วม: ${eventData.currentParticipants}/${eventData.maxParticipants || 0}</small>
      </div>
      <div class="event-footer">
        <button class="join-btn ${isJoined ? 'joined' : ''}" ${status === "closed" ? "disabled" : ""}>
          ${status === "closed" ? "CLOSED" : (isJoined ? "UNJOIN" : "JOIN")}
        </button>
      </div>
    `;
    
    const joinBtn = card.querySelector(".join-btn");
    joinBtn.addEventListener("click", e => {
      e.stopPropagation();
      if (status !== "closed") {
        joinEvent(eventData.id, isJoined);
      }
    });
    
    card.addEventListener("click", () => {
      openPopup(eventData);
    });
    
    return card;
  }

  function updatePostStatus(event){
    const now = new Date(new Date().toLocaleString("en-US",{timeZone:TIMEZONE}));
    const isFull = (event.maxParticipants>0 && event.currentParticipants>=event.maxParticipants);
    const isExpired = event.dateClose && new Date(event.dateClose)<now;
    const isClosedByHost = event.status==="closed";
    event.status = (isFull || isExpired || isClosedByHost)?"closed":"open";
    return event.status;
  }

  async function joinEvent(postId, isCurrentlyJoined = false) {
    if (!isLoggedIn) {
      showToast.warning("กรุณาเข้าสู่ระบบก่อนเข้าร่วมกิจกรรม");
      setTimeout(() => window.location.href = window.LoginUrl, 1500);
      return;
    }
    
    const action = isCurrentlyJoined ? "Unjoin" : "Join";
    const endpoint = `/Post/${action}Event?postId=${postId}`;
    
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin"
      });
      
      if (response.status === 401) {
        showToast.warning("กรุณาเข้าสู่ระบบ");
        setTimeout(() => window.location.href = window.LoginUrl, 1500);
        return;
      }
      
      const result = await response.json();
      
      if (!response.ok) {
        showToast.error(result.message || "ไม่สามารถดำเนินการได้");
        return;
      }
      
      showToast.success(result.message);
      await loadEventsByTag(tagQuery);
      
      if (!popup.classList.contains("hidden")) {
        popup.classList.add("hidden");
      }
      
    } catch (error) {
      console.error("Error join/unjoin:", error);
      showToast.error("เกิดข้อผิดพลาด");
    }
  }

  // ==================== POPUP & COMMENT SYSTEM START ====================
  const popup = document.getElementById("event-popup");
  const closePopupBtn = document.getElementById("close-popup");
  let currentPostId = null;

  function openPopup(eventData) {
    currentPostId = eventData.id;
    
    console.log("=== POPUP DEBUG ===");
    console.log("Event ID:", eventData.id);
    console.log("Current User ID:", currentUserId, "Type:", typeof currentUserId);
    console.log("Participants:", eventData.participants);
    
    document.getElementById("event-title").textContent = eventData.eventName;
    document.getElementById("event-host").textContent = eventData.host;
    document.getElementById("event-place").textContent = eventData.location || "ไม่ระบุ";
    
    const participantsList = document.getElementById("participants-list");
    participantsList.innerHTML = "";
    if(eventData.participants && eventData.participants.length > 0) {
      eventData.participants.forEach(p => {
        const li = document.createElement("li");
        li.textContent = `User ${p}`;
        participantsList.appendChild(li);
      });
    } else {
      participantsList.innerHTML = "<li>ยังไม่มีผู้เข้าร่วม</li>";
    }
    
    const isJoined = isUserJoined(eventData.participants);
    const joinBtn = document.getElementById("popup-join-btn");
    joinBtn.textContent = isJoined ? "UNJOIN" : "JOIN";
    joinBtn.style.backgroundColor = isJoined ? "#6c757d" : "";
    
    loadComments(currentPostId);
    popup.classList.remove("hidden");
  }

  async function loadComments(postId) {
    const commentList = document.getElementById("popup-comment-list");
    commentList.innerHTML = "<p>กำลังโหลด...</p>";
    
    try {
      const response = await fetch(`/Post/GetComments?postId=${postId}`);
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

  document.getElementById("popup-comment-send").addEventListener("click", async () => {
    const input = document.getElementById("popup-comment-input");
    const text = input.value.trim();
    
    if (!isLoggedIn) {
      showToast.warning("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น");
      setTimeout(() => window.location.href = window.LoginUrl, 1500);
      return;
    }

    if (!text) {
      showToast.warning("กรุณากรอกความคิดเห็น");
      return;
    }
    
    if (!currentPostId) {
      showToast.error("เกิดข้อผิดพลาด");
      return;
    }
    
    try {
      const response = await fetch(`/Post/AddComment?postId=${currentPostId}&commentText=${encodeURIComponent(text)}`, {
        method: "POST"
      });
          
    if (response.status === 401) {
      showToast.warning("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น");
      setTimeout(() => window.location.href = window.LoginUrl, 1500);
        return;
      }
      
      if (!response.ok) {
        throw new Error("ไม่สามารถส่ง comment ได้");
      }
      
      input.value = "";
      showToast.success("ส่งความคิดเห็นสำเร็จ");
      loadComments(currentPostId);
      
    } catch (error) {
      console.error("Error sending comment:", error);
      showToast.error("เกิดข้อผิดพลาดในการส่งความคิดเห็น");
    }
  });

  document.getElementById("popup-comment-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      document.getElementById("popup-comment-send").click();
    }
  });

  document.getElementById("popup-join-btn").addEventListener("click", async () => {
    if (!currentPostId) {
      showToast.error("เกิดข้อผิดพลาด");
      return;
    }
    
    const currentEvent = cachedEvents.find(e => e.id === currentPostId);
    if (!currentEvent) return;
    
    const isJoined = isUserJoined(currentEvent.participants);
    await joinEvent(currentPostId, isJoined);
  });

  closePopupBtn.addEventListener("click", () => {
    popup.classList.add("hidden");
    currentPostId = null;
    document.getElementById("popup-comment-input").value = "";
  });

  // ==================== POPUP & COMMENT SYSTEM END ====================

  // ---------------- Initial Load ----------------
  loadEventsByTag(tagQuery);
});