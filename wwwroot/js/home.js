const TIMEZONE = "Asia/Bangkok";

// ==================== PROFILE POPUP SYSTEM START ====================
function showProfilePopup(userId) {
  const overlay = document.getElementById("profile-popup-overlay");
  const avatar = document.getElementById("profile-popup-avatar");
  const fullname = document.getElementById("profile-popup-fullname");
  const username = document.getElementById("profile-popup-username");
const followBtn = document.getElementById("profile-popup-follow-btn");
overlay.style.display = "flex";
avatar.src = "/uploads/default-avatar.png";
fullname.textContent = "Loading...";
username.textContent = "";
followBtn.style.display = "none";
followBtn.disabled = true;

fetch(`/Profile/GetUserProfile?userId=${userId}`)
  .then(res => res.json())
  .then(data => {
    avatar.src = data.avatar || "/uploads/default-avatar.png";
    fullname.textContent = `${data.firstName} ${data.lastName}`;
    username.textContent = data.username ? `@${data.username}` : "";
    followBtn.style.display = (data.isSelf ? "none" : "inline-block");
    followBtn.disabled = false;
    followBtn.textContent = data.isFollowing ? "Unfollow" : "Follow";
    followBtn.classList.toggle("unfollow", !!data.isFollowing);
    
    followBtn.onclick = async () => {
      followBtn.disabled = true;
      
      try {
        let res;
        if (data.isFollowing) {
          // Unfollow
          res = await fetch(`/Post/UnfollowUser`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ followingId: userId })
          });
        } else {
          // Follow
          res = await fetch(`/Post/FollowUser`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ followingId: userId })
          });
        }
        
        const result = await res.json();
        
        if (res.ok) {
          data.isFollowing = !data.isFollowing;
          followBtn.textContent = data.isFollowing ? "Unfollow" : "Follow";
          followBtn.classList.toggle("unfollow", !!data.isFollowing);
          showToast.success(result.message || (data.isFollowing ? 'ติดตามสำเร็จ' : 'เลิกติดตามสำเร็จ'));
        } else {
          showToast.error(result.message || 'เกิดข้อผิดพลาด');
        }
      } catch (error) {
        console.error('Error:', error);
        showToast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      }
      
      followBtn.disabled = false;
    };
  })
  .catch(() => {
    fullname.textContent = "ไม่พบข้อมูลผู้ใช้";
    username.textContent = "";
    followBtn.style.display = "none";
  });
}
document.getElementById("close-profile-popup").onclick = () => {
  document.getElementById("profile-popup-overlay").style.display = "none";
};
document.getElementById("profile-popup-overlay").addEventListener("click", e => {
  if (e.target === e.currentTarget) e.currentTarget.style.display = "none";
});

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

// ==================== MAIN APPLICATION LOGIC START ====================
document.addEventListener("DOMContentLoaded", async () => {
  const addBtn = document.querySelector(".sidebar .add"); 
  const createEventModal = document.getElementById("createEventModal");
  const closeModalBtn = document.querySelector(".close-btn");
  
  // ==================== เช็ค LOGIN จาก SESSION START ====================
  const response = await fetch('/Profile/GetSessionData');
  const data = await response.json();
  
  let currentUserId = data.userId || null;
  let isLoggedIn = data.isLoggedIn || false;
  let currentUserName = data.isLoggedIn ? `${data.firstName} ${data.lastName}` : "";

  // Global serverNow for time calculations
  let serverNow = null;
  let serverNowClientReceived = null;

  // Helper to sync serverNow with client time
  function setServerNowFromEvents(events) {
    if (Array.isArray(events) && events.length > 0 && events[0].serverNow) {
      serverNow = new Date(events[0].serverNow.replace(/ /, 'T'));
      serverNowClientReceived = new Date();
    } else {
      serverNow = null;
      serverNowClientReceived = null;
    }
  }

  console.log("Login Status:", isLoggedIn ? "Logged in" : "Not logged in");
  console.log("User ID:", currentUserId, "Name:", currentUserName);
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
  function parseDateTimeWithTZ(dateStr, tz = "Asia/Bangkok") {
    if (!dateStr) return new Date();
    let [date, time] = dateStr.split(" ");
    // ถ้าเป็นปี พ.ศ. (>=2400) ให้แปลงเป็น ค.ศ.
    let [year, month, day] = date.split("-");
    if (parseInt(year) > 2400) {
      year = (parseInt(year) - 543).toString();
      date = [year, month, day].join("-");
    }
    if (!time) return new Date(date);
    return new Date(`${date}T${time}+07:00`);
  }
  // ---------------- Sidebar Tabs ----------------
  document.querySelectorAll(".menu h2").forEach(item => {
    item.addEventListener("click", async () => {
      document.querySelectorAll(".menu h2").forEach(el=>el.classList.remove("active"));
      item.classList.add("active");
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      document.getElementById(item.dataset.tab).classList.add("active");
      if(item.dataset.tab === "follow") {
        if (!isLoggedIn) {
          showToast.warning("กรุณาเข้าสู่ระบบเพื่อดูโพสที่คุณติดตาม");
          followFeed.innerHTML = "<p style='padding:2rem;'>กรุณาเข้าสู่ระบบ</p>";
          cachedEvents = [];
          return;
        }
        try {
          const res = await fetch(`/Post/GetFollowedPosts/${currentUserId}`);
          if (!res.ok) throw new Error("โหลดโพสไม่สำเร็จ");
          let data = await res.json();
          // Support both array and { posts: [...], serverNow: ... }
          if (Array.isArray(data)) {
            cachedEvents = data;
          } else if (data && Array.isArray(data.posts)) {
            cachedEvents = data.posts;
            // Attach serverNow to each post for time calculation
            if (data.serverNow) {
              cachedEvents.forEach(post => post.serverNow = data.serverNow);
            }
          } else {
            cachedEvents = [];
          }
          console.log('DEBUG: cachedEvents', cachedEvents);
          setServerNowFromEvents(cachedEvents);
          renderEventsCache();
        } catch (e) {
          followFeed.innerHTML = "<p style='padding:2rem;color:red;'>เกิดข้อผิดพลาด</p>";
          cachedEvents = [];
        }
      } else {
        await loadEventsByTag(tagQuery);
      }
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
    if (!isLoggedIn) {
      showToast.warning("กรุณาเข้าสู่ระบบก่อนสร้างกิจกรรม");
      return;
    }
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
      let data = await res.json();
      // Support both array and { posts: [...], serverNow: ... }
      if (Array.isArray(data)) {
        cachedEvents = data;
      } else if (data && Array.isArray(data.posts)) {
        cachedEvents = data.posts;
        // Attach serverNow to each post for time calculation
        if (data.serverNow) {
          cachedEvents.forEach(post => post.serverNow = data.serverNow);
        }
      } else {
        cachedEvents = [];
      }
      console.log('DEBUG: cachedEvents', cachedEvents);
      setServerNowFromEvents(cachedEvents);
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
    forYouFeed.innerHTML = "";
    followFeed.innerHTML = "";
    const activeTab = document.querySelector('.menu h2.active').dataset.tab;
    if (activeTab === "follow") {
      cachedEvents.forEach(event => {
        const card = createEventCard(event);
        followFeed.appendChild(card);
      });
    } else {
      cachedEvents.forEach(event => {
        const card = createEventCard(event);
        forYouFeed.appendChild(card);
      });
    }
  }

  function createEventCard(eventData) {
    const card = document.createElement("div");
    card.className = "event-card";
    card.dataset.eventId = eventData.id;
    const status = updatePostStatus(eventData);
    const avatarHTML = `<img src="${eventData.avatar}" alt="avatar" class="avatar">`;
    const isJoined = isUserJoined(eventData.participants);

    // ใช้ฟังก์ชันนี้แทนของเดิม
    function getTimeSinceCreated(createdAtStr) {
      if (!createdAtStr) return "-";
      const created = parseDateTimeWithTZ(createdAtStr, TIMEZONE);
      let now;
      if (serverNow && serverNowClientReceived) {
        const elapsed = new Date() - serverNowClientReceived;
        now = new Date(serverNow.getTime() + elapsed);
      } else {
        now = new Date(new Date().toLocaleString("en-US",{timeZone:TIMEZONE}));
      }
      console.log('DEBUG: createdAtStr', createdAtStr, 'created', created, 'now', now);
      const diffMs = now - created;
      console.log('DEBUG: Time diffMs', diffMs);
      if (diffMs < 60000) return "เมื่อกี้นี้";
      const diffMin = Math.floor(diffMs/60000);
      if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
      const diffHr = Math.floor(diffMin/60);
      if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
      const diffDay = Math.floor(diffHr/24);
      return `${diffDay} วันที่แล้ว`;
    }
    const createdText = getTimeSinceCreated(eventData.createdAt);

    // ...existing code...
    card.innerHTML = `
      <div class="event-header">
        <div class="host-info">
          ${avatarHTML}
          <span class="host" data-host-id="${eventData.hostId || ''}" style="cursor: pointer;">${eventData.host}</span>
          <small class="time">${createdText}</small>
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
    
    const hostElement = card.querySelector(".host");
    hostElement.addEventListener("click", e => {
      e.stopPropagation();
      if (eventData.hostId) {
        showProfilePopup(eventData.hostId);
      } else {
        showToast.warning("ไม่พบข้อมูลผู้สร้างโพสต์");
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
    // ดึงข้อมูลโพสต์แบบละเอียดเพื่อให้ได้ participants ที่เป็น object
    fetch(`/Post/GetPostById/${eventData.id}`)
      .then(res => res.json())
      .then(data => {
        const detail = data.post;
        document.getElementById("event-title").textContent = detail.eventName;
        const hostElement = document.getElementById("event-host");
        hostElement.textContent = detail.host;
        hostElement.style.cursor = "pointer";
        hostElement.style.color = "var(--head-font)";
        hostElement.style.transition = "color 0.2s ease";
        hostElement.onclick = (e) => {
          e.stopPropagation();
          if (detail.hostId) {
            showProfilePopup(detail.hostId);
          } else {
            showToast.warning("ไม่พบข้อมูลผู้สร้างโพสต์");
          }
        };
        hostElement.onmouseenter = () => {
          hostElement.style.color = "var(--border)";
          hostElement.style.textDecoration = "underline";
        };
        hostElement.onmouseleave = () => {
          hostElement.style.color = "var(--head-font)";
          hostElement.style.textDecoration = "none";
        };
        document.getElementById("event-place").textContent = detail.location || "ไม่ระบุ";
        const participantsList = document.getElementById("participants-list");
        participantsList.innerHTML = "";
        if(detail.participants && detail.participants.length > 0) {
          detail.participants.forEach(p => {
            const li = document.createElement("li");
            li.innerHTML = `<img src="${p.avatar}" style="width:24px;height:24px;border-radius:50%;vertical-align:middle;margin-right:6px;"> ${p.name}`;
            participantsList.appendChild(li);
          });
        } else {
          participantsList.innerHTML = "<li>ยังไม่มีผู้เข้าร่วม</li>";
        }
        const isJoined = isUserJoined(detail.participants.map(x=>x.userId));
        const joinBtn = document.getElementById("popup-join-btn");
        const now = new Date(new Date().toLocaleString("en-US",{timeZone:TIMEZONE}));
        const isFull = (detail.maxParticipants>0 && detail.currentParticipants>=detail.maxParticipants);
        const isExpired = detail.dateClose && new Date(detail.dateClose)<now;
        const isClosedByHost = detail.status==="closed";
        const isClosed = (isFull || isExpired || isClosedByHost);
        joinBtn.textContent = isClosed ? "CLOSED" : (isJoined ? "UNJOIN" : "JOIN");
        joinBtn.style.backgroundColor = isJoined ? "#6c757d" : "";
        joinBtn.disabled = isClosed;
        loadComments(currentPostId);
        popup.classList.remove("hidden");
      });
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


function loadTagsToSelect(selectElementId = "tagSelect") {
    const select = document.getElementById(selectElementId);
    if (!select) return;

    // ล้าง option เดิมฟฟฟ
    select.innerHTML = "";

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/Post/GetAllTags", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const tags = JSON.parse(xhr.responseText);
                    // เพิ่ม option เริ่มต้น
                    const defaultOption = document.createElement("option");
                    defaultOption.value = "";
                    defaultOption.textContent = "เลือกแท็ก";
                    select.appendChild(defaultOption);

                    tags.forEach(tag => {
                        const option = document.createElement("option");
                        option.value = tag.tag_id;     // หรือ tag.tag_name ตามต้องการ
                        option.textContent = tag.tag_name;
                        select.appendChild(option);
                    });
                } catch (e) {
                    console.error("Parse JSON error:", e);
                }
            } else {
                console.error("โหลด tag ไม่สำเร็จ", xhr.status, xhr.statusText);
            }
        }
    };
    xhr.send();
}

// เรียกใช้ตอน DOM โหลดเสร็จ
document.addEventListener("DOMContentLoaded", () => {
    loadTagsToSelect("tagSelect");
});

setInterval(checkNotification, 5000);
checkNotification();

  // ---------------- Initial Load ----------------
  loadEventsByTag(tagQuery);
});