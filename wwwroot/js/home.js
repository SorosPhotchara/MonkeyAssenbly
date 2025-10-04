document.addEventListener("DOMContentLoaded", () => {
  const TIMEZONE = "Asia/Bangkok";
  let currentUserId = localStorage.getItem("userId") || "";
  let isLoggedIn = !!currentUserId;

  // ---------------- Theme ----------------
  const root = document.documentElement;
  const toggle = document.getElementById("toggle");
  const sunIcon = document.querySelector(".toggle .bxs-sun");
  const moonIcon = document.querySelector(".toggle .bx-moon");
  if (localStorage.getItem("theme")==="dark"){ root.classList.add("dark"); toggle.checked=true; }
  toggle.addEventListener("change", () => {
    const isDark = root.classList.toggle("dark");
    localStorage.setItem("theme", isDark?"dark":"light");
    sunIcon.className = isDark?"bx bx-sun":"bxs-sun";
    moonIcon.className = isDark?"bx bx-moon":"bxs-moon";
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
  const addMenuItem = (text,onClick)=>{ const li=document.createElement("li"); li.textContent=text; li.addEventListener("click", onClick); menuList.appendChild(li); };
  const updateMenu = ()=>{
    menuList.innerHTML="";
    if(!isLoggedIn){
      addMenuItem("เข้าสู่ระบบ", () => window.location.href = window.LoginUrl);
      addMenuItem("สมัครสมาชิก",()=>window.location.href= window.SignupUrl);
    } else {
      addMenuItem("โปรไฟล์ของฉัน", () => window.location.href = window.ProfileUrl);
      addMenuItem("ออกจากระบบ", async ()=>{
        try{
          await fetch("/Login/Logout",{method:"POST"});
          localStorage.removeItem("userId");
          currentUserId=""; isLoggedIn=false; updateMenu();
          alert("ออกจากระบบเรียบร้อย");
          window.location.reload();
        } catch(err){ alert("เกิดข้อผิดพลาด: "+err.message); }
      });
    }
  };
  updateMenu();

  // ---------------- Event Feed ----------------
  const forYouFeed = document.getElementById("for-you");
  const followFeed = document.getElementById("follow");
  let cachedEvents=[];
  

  async function loadEvents() {
    try {
      const res = await fetch('/Post/GetAllPost');
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
      cachedEvents = await res.json();
      renderEventsCache();
    } catch (err) {
      console.error("Error fetching events:", err);
      cachedEvents = [];
      renderEventsCache();
    }
  }


  function renderEventsCache(){
      forYouFeed.innerHTML=""; 
      followFeed.innerHTML="";

      cachedEvents.forEach(event => {
      // --- For You Feed ---
      const cardForYou = createEventCard(event);
      forYouFeed.appendChild(cardForYou);

      // --- Follow Feed ---
      if (isLoggedIn && event.hostsFollowing && event.hostsFollowing.includes(currentUserId)) {
        const cardFollow = createEventCard(event, true);
        followFeed.appendChild(cardFollow);
      }
    });
  }

  function createEventCard(event) {
    const card = document.createElement("div");
    card.className = "event-card";
    card.dataset.eventId = event.id;
    const status = updatePostStatus(event);
    const avatarHTML = `<img src="${event.avatar}" alt="avatar" class="avatar">`;

    card.innerHTML = `
      <div class="event-header">
        <div class="host-info">
          ${avatarHTML}
          <span class="host">${event.host}</span>
          <small class="time">0 นาที</small>
        </div>
        <span class="status ${status}">${status.toUpperCase()}</span>
      </div>
      <div class="event-body">
        <h3>${event.eventName}</h3>
        <p>${event.description}</p>
        <small>สถานที่: ${event.location || "ไม่ระบุ"}</small><br>
        <small>เวลาเปิดรับ: ${event.startTime || ""} - ${event.endTime || ""}</small><br>
        <small>วันที่: ${event.dateOpen || ""} ถึง ${event.dateClose || ""}</small><br>
        <small>ผู้เข้าร่วม: ${event.currentParticipants}/${event.maxParticipants || 0}</small>
      </div>
      <div class="event-footer">
        <button class="join-btn" ${status === "closed" ? "disabled" : ""}>
          ${status === "closed" ? "CLOSED" : "JOIN"}
        </button>
      </div>
    `;

    card.addEventListener("click", () => openPopup(event));
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

  function updateEventCards(){
    const now = new Date(new Date().toLocaleString("en-US",{timeZone:TIMEZONE}));
    document.querySelectorAll(".event-card").forEach(card=>{
      const eventId = card.dataset.eventId;
      const event = cachedEvents.find(ev=>ev.id==eventId);
      if(!event) return;
      
      const timeElem = card.querySelector(".time");
      const joinBtn = card.querySelector(".join-btn");
      const statusElem = card.querySelector(".status");
      
      const startTime = new Date(event.dateOpen);
      const diffMs = now-startTime;
      const diffMin=Math.floor(diffMs/60000);
      const diffHour=Math.floor(diffMin/60);
      const diffDay=Math.floor(diffHour/24);
      
      if(diffDay > 0) {
        timeElem.textContent = `${diffDay} วัน`;
      } else if(diffHour > 0) {
        timeElem.textContent = `${diffHour} ชั่วโมง`;
      } else {
        timeElem.textContent = `${diffMin} นาที`;
      }
      
      const status = updatePostStatus(event);
      joinBtn.disabled = status==="closed";
      joinBtn.textContent = status==="closed"?"CLOSED":"JOIN";
      statusElem.textContent = status.toUpperCase();
      statusElem.className = `status ${status}`;
    });
  }
  setInterval(updateEventCards,30000);
  updateEventCards();

  // ---------------- Create Event Modal ----------------
  const addBtn = document.querySelector(".sidebar .add"); 
  const createEventModal = document.getElementById("createEventModal");
  const closeModalBtn = document.querySelector(".close-btn");

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

  // ==================== POPUP & COMMENT SYSTEM START ====================

  const popup = document.getElementById("event-popup");
  const closePopupBtn = document.getElementById("close-popup");
  let currentPostId = null; // เก็บ post_id ปัจจุบันที่เปิดอยู่

  // เปิด popup และโหลด comments
  function openPopup(event) {
    currentPostId = event.id; // เก็บ post_id ไว้ใช้ตอนส่ง comment
    
    // แสดงข้อมูล event
    document.getElementById("event-title").textContent = event.eventName;
    document.getElementById("event-host").textContent = event.host;
    document.getElementById("event-place").textContent = event.location || "ไม่ระบุ";
    
    // แสดงรายชื่อผู้เข้าร่วม
    const participantsList = document.getElementById("participants-list");
    participantsList.innerHTML = "";
    if(event.participants && event.participants.length > 0) {
      event.participants.forEach(p => {
        const li = document.createElement("li");
        li.textContent = `User ${p}`;
        participantsList.appendChild(li);
      });
    } else {
      participantsList.innerHTML = "<li>ยังไม่มีผู้เข้าร่วม</li>";
    }
    
    // โหลด comments
    loadComments(currentPostId);
    
    // แสดง popup
    popup.classList.remove("hidden");
  }

  // โหลด comments จาก database
  async function loadComments(postId) {
    const commentList = document.getElementById("popup-comment-list");
    commentList.innerHTML = "<p>กำลังโหลด...</p>";
    
    try {
      const response = await fetch(`/Post/GetComments?postId=${postId}`);
      if (!response.ok) throw new Error("ไม่สามารถโหลด comments ได้");
      
      const comments = await response.json();
      
      // ล้างข้อมูลเก่า
      commentList.innerHTML = "";
      
      // แสดง comments
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
      
      // Scroll ไปล่างสุด
      commentList.scrollTop = commentList.scrollHeight;
      
    } catch (error) {
      console.error("Error loading comments:", error);
      commentList.innerHTML = "<p style='color:red;'>เกิดข้อผิดพลาดในการโหลด comments</p>";
    }
  }

  // ส่ง comment ใหม่
  document.getElementById("popup-comment-send").addEventListener("click", async () => {
    const input = document.getElementById("popup-comment-input");
    const text = input.value.trim();
    
    // ตรวจสอบว่ากรอกข้อความหรือยัง
    if (!text) {
      alert("กรุณากรอกความคิดเห็น");
      return;
    }
    
    // ตรวจสอบว่าเปิด popup อยู่หรือไม่
    if (!currentPostId) {
      alert("เกิดข้อผิดพลาด");
      return;
    }
    
    try {
      // ส่งข้อมูลไปยัง server
      const response = await fetch(`/Post/AddComment?postId=${currentPostId}&commentText=${encodeURIComponent(text)}`, {
        method: "POST"
      });
      
      if (response.status === 401) {
        alert("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น");
        window.location.href = window.LoginUrl;
        return;
      }
      
      if (!response.ok) {
        throw new Error("ไม่สามารถส่ง comment ได้");
      }
      
      // ล้าง input
      input.value = "";
      
      // โหลด comments ใหม่
      loadComments(currentPostId);
      
    } catch (error) {
      console.error("Error sending comment:", error);
      alert("เกิดข้อผิดพลาดในการส่ง comment");
    }
  });

  // กด Enter ก็ส่ง comment ได้
  document.getElementById("popup-comment-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      document.getElementById("popup-comment-send").click();
    }
  });

  // ปิด popup
  closePopupBtn.addEventListener("click", () => {
    popup.classList.add("hidden");
    currentPostId = null; // ล้างค่า
    document.getElementById("popup-comment-input").value = ""; // ล้าง input
  });

// ==================== POPUP & COMMENT SYSTEM END ====================

  // ---------------- Initial Load ----------------
  loadEvents();
  
  // Auto-hide alerts after 5 seconds
  setTimeout(() => {
    document.querySelectorAll('.alert').forEach(alert => {
      alert.style.display = 'none';
    });
  }, 5000);
});