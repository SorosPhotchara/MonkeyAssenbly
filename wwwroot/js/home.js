document.addEventListener("DOMContentLoaded", () => {
  const SERVER_URL = "http://localhost:3000";
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
      if (!isLoggedIn && item.dataset.tab==="follow") {
        window.location.href=window.LoginUrl;
        return;
      }

      document.querySelectorAll(".menu h2").forEach(el=>el.classList.remove("active"));
      item.classList.add("active");
      document.querySelectorAll(".tab-content").forEach(c=>c.classList.remove("active"));
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
      addMenuItem("สมัครสมาชิก",()=>window.location.href="/frontend/HTML/signup.html");
    } else {
      addMenuItem("โปรไฟล์ของฉัน",()=>window.location.href="/frontend/HTML/profile.html");
      addMenuItem("ออกจากระบบ", async ()=>{
        try{
          await fetch("/Account/Logout",{method:"POST"});
          localStorage.removeItem("userId");
          currentUserId=""; isLoggedIn=false; updateMenu();
          alert("ออกจากระบบเรียบร้อย");
        } catch(err){ alert("เกิดข้อผิดพลาด: "+err.message); }
      });
    }
  };
  updateMenu();

  // ---------------- Event Feed ----------------
  const forYouFeed = document.getElementById("for-you");
  const followFeed = document.getElementById("follow");
  let cachedEvents=[];

  async function loadEvents(){
    try{
      const res = await fetch(`${SERVER_URL}/events`);
      cachedEvents = await res.json();
      renderEventsCache();
    } catch(err){
      console.error("Error fetching events:", err);
      cachedEvents = [];
      renderEventsCache();
    }
  }

  function renderEventsCache(){
    forYouFeed.innerHTML=""; followFeed.innerHTML="";
    cachedEvents.forEach(event=>{
      const card = createEventCard(event);
      forYouFeed.appendChild(card);
      if(isLoggedIn && event.hostsFollowing){ followFeed.appendChild(card.cloneNode(true)); }
    });
  }

  function createEventCard(event){
    const card = document.createElement("div");
    card.className="event-card"; card.dataset.eventId=event.id;
    const status = updatePostStatus(event);
    card.innerHTML=`
      <div class="event-header">
        <div class="host-info">
          <span class="avatar" style="background:purple"></span>
          <span class="host">${event.host}</span>
          <small class="time">0 นาที</small>
        </div>
        <span class="status ${status}">${status.toUpperCase()}</span>
      </div>
      <div class="event-body">
        <h3>${event.eventName}</h3>
        <p>${event.description}</p>
        <small>สถานที่: ${event.location||"ไม่ระบุ"}</small><br>
        <small>เวลาเปิดรับ: ${event.startTime||""} - ${event.endTime||""}</small><br>
        <small>ผู้เข้าร่วม: ${event.participants.length}/${event.maxParticipants||0}</small>
      </div>
      <div class="event-footer">
        <button class="join-btn" ${status==="closed"?"disabled":""}>${status==="closed"?"CLOSED":"JOIN"}</button>
      </div>
    `;

    const joinBtn = card.querySelector(".join-btn");

    joinBtn.addEventListener("click", e=>{
      e.stopPropagation();
      if(!isLoggedIn){
        alert("กรุณาเข้าสู่ระบบเพื่อเข้าร่วม"); 
        window.location.href=window.LoginUrl; 
        return; 
      }
      joinEvent(event);
    });

    card.addEventListener("click", ()=>openPopup(event));
    return card;
  }

  function updatePostStatus(event){
    const now = new Date(new Date().toLocaleString("en-US",{timeZone:TIMEZONE}));
    const isFull = (event.maxParticipants>0 && event.participants?.length>=event.maxParticipants);
    const isExpired = event.endTime && new Date(event.endTime)<now;
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
      const startTime = new Date(event.startTime); const endTime=new Date(event.endTime);
      const timeElem = card.querySelector(".time"); const joinBtn = card.querySelector(".join-btn"); const statusElem = card.querySelector(".status");
      const diffMs = now-startTime; const diffMin=Math.floor(diffMs/60000); const diffHour=Math.floor(diffMin/60);
      timeElem.textContent = diffHour>0?`${diffHour} ชั่วโมง`:`${diffMin} นาที`;
      const status = updatePostStatus(event);
      joinBtn.disabled = status==="closed";
      joinBtn.textContent = status==="closed"?"CLOSED":"JOIN";
      statusElem.textContent = status.toUpperCase();
      statusElem.className = `status ${status}`;
    });
  }
  setInterval(updateEventCards,30000);
  updateEventCards();

  // ---------------- Join / Unjoin ----------------
  async function joinEvent(event){
    try{
      const action = event.participants.includes(currentUserId)?"unjoin":"join";
      await fetch(`${SERVER_URL}/events/${event.id}/${action}`,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({userId:currentUserId})
      });
      await loadEvents();
    } catch(err){
      console.error("join/unjoin error:",err);
      alert("เกิดข้อผิดพลาดขณะ join/unjoin");
    }
  }

  // ---------------- Popup ----------------
  const popup = document.getElementById("event-popup");
  const popupJoinBtn = document.getElementById("popup-join-btn");
  const commentInput = document.getElementById("popup-comment-input");
  const commentSend = document.getElementById("popup-comment-send");
  const commentList = document.getElementById("popup-comment-list");
  let currentEventId=null; let isJoined=false;

  function openPopup(event){
    currentEventId=event.id; popup.classList.remove("hidden");
    fetch(`${SERVER_URL}/events/${currentEventId}`).then(r=>r.json()).then(data=>{
      document.getElementById("event-title").textContent=data.eventName;
      document.getElementById("event-host").textContent=data.host;
      document.getElementById("event-place").textContent=data.location||"ไม่ระบุ";

      const list=document.getElementById("participants-list"); list.innerHTML="";
      (data.participants||[]).forEach(u=>{ const li=document.createElement("li"); li.textContent=u; list.appendChild(li); });

      isJoined = (data.participants||[]).includes(currentUserId);
      popupJoinBtn.textContent = isJoined?"UNJOIN":"JOIN"; 

      if(!isLoggedIn){
        popupJoinBtn.disabled = true;
        commentInput.disabled = true;
        commentSend.disabled = true;
      } else {
        popupJoinBtn.disabled = false;
        commentInput.disabled = false;
        commentSend.disabled = false;
      }

      commentList.innerHTML="";
      (data.comments||[]).forEach(c=>{ const p=document.createElement("p"); p.innerHTML=`<b>${c.user}</b>: ${c.text}`; commentList.appendChild(p); });
    });
  }

  popupJoinBtn.addEventListener("click", async ()=>{
    if(!isLoggedIn){
        window.location.href = window.LoginUrl;
      return;
    }
    if(!currentEventId) return;
    const action = isJoined?"unjoin":"join";
    try{
      await fetch(`${SERVER_URL}/events/${currentEventId}/${action}`,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({userId:currentUserId})
      });
      await loadEvents();
      openPopup(cachedEvents.find(ev=>ev.id===currentEventId));
      isJoined = !isJoined;
      popupJoinBtn.textContent = isJoined?"UNJOIN":"JOIN";
    } catch(err){ alert("เกิดข้อผิดพลาด"); }
  });

  commentSend.addEventListener("click", async ()=>{
    if(!isLoggedIn){
        window.location.href = window.LoginUrl;
      return;
    }
    const text = commentInput.value.trim(); if(!text || !currentEventId) return;
    try{
      await fetch(`${SERVER_URL}/events/${currentEventId}/comments`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({user:currentUserId,text})
      });
      commentInput.value="";
      await loadEvents();
      openPopup(cachedEvents.find(ev=>ev.id===currentEventId));
    } catch(err){ alert("เกิดข้อผิดพลาดขณะส่ง comment"); }
  });

  document.getElementById("close-popup").addEventListener("click", ()=>{
    popup.classList.add("hidden"); commentInput.value=""; commentList.innerHTML=""; currentEventId=null; isJoined=false;
  });

  // ---------------- Initial Load ----------------
  loadEvents();
});