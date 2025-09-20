// ---------------- Config ----------------
const SERVER_URL = "http://localhost:3000"; // backend URL
const TIMEZONE = "Asia/Bangkok";
const currentUserId = localStorage.getItem("userId") || "mockUser";

// ---------------- Theme / Sidebar ----------------
const menuItems = document.querySelectorAll(".menu h2");
const root = document.documentElement;
const toggle = document.getElementById("toggle");
const sunIcon = document.querySelector(".toggle .bxs-sun");
const moonIcon = document.querySelector(".toggle .bx-moon");

if (localStorage.getItem("theme") === "dark") {
  root.classList.add("dark");
  toggle.checked = true;
}

toggle.addEventListener("change", () => {
  root.classList.toggle("dark");
  localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light");
  sunIcon.className = sunIcon.className.includes("bxs") ? "bx bx-sun" : "bx bxs-sun";
  moonIcon.className = moonIcon.className.includes("bxs") ? "bx bx-moon" : "bx bxs-moon";
});

menuItems.forEach(item => {
  item.addEventListener("click", () => {
    menuItems.forEach(el => el.classList.remove("active"));
    item.classList.add("active");
  });
});

// ---------------- Modal Create Event ----------------
const modal = document.getElementById("createEventModal");
const createForm = document.getElementById("createEventForm");
const textarea = createForm.querySelector("textarea");
const closeBtn = modal.querySelector(".close-btn");

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
  createForm.reset();
});

const sidebarLinks = document.querySelectorAll(".sidebar a");
sidebarLinks.forEach((link, index) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    sidebarLinks.forEach(el => el.classList.remove("active"));
    link.classList.add("active");
    switch (index) {
        case 0: window.location.href = window.HomeUrl; break;
        case 1: window.location.href = window.TagsUrl; break;
        case 2: modal.style.display = "flex"; textarea.focus(); break;
        case 3: window.location.href = window.NotifyUrl; break;
        case 4: window.location.href = window.ProfileUrl; break;
    }
  });
});

// ---------------- Hamburger Menu ----------------
let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
const hamburgerBtn = document.getElementById("hamburgerBtn");
const hamburgerMenu = document.getElementById("hamburgerMenu");
const menuList = document.getElementById("menuList");

function addMenuItem(text, onClick) {
  const li = document.createElement("li");
  li.textContent = text;
  li.addEventListener("click", onClick);
  menuList.appendChild(li);
}

function setLoginState(state) {
  isLoggedIn = state;
  localStorage.setItem("isLoggedIn", state);
  updateMenu();
}

function updateMenu() {
  menuList.innerHTML = "";
  if (!isLoggedIn) {
    addMenuItem("เข้าสู่ระบบ", () => window.location.href = "/frontend/HTML/login.html");
    addMenuItem("สมัครสมาชิก", () => window.location.href = "/frontend/HTML/signup.html");
  } else {
    addMenuItem("โปรไฟล์ของฉัน", () => window.location.href = "/frontend/HTML/profile.html");
    addMenuItem("ออกจากระบบ", async () => {
      try {
        await fetch("/Account/Logout", { method: "POST" });
        setLoginState(false);
        alert("ออกจากระบบเรียบร้อย");
      } catch (err) { alert("เกิดข้อผิดพลาด: " + err.message); }
    });
  }
}

function toggleMenu(open) {
  hamburgerMenu.style.display = open ? "block" : "none";
  hamburgerBtn.querySelector("i").className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
}

let menuOpen = false;
hamburgerBtn.addEventListener("click", () => {
  menuOpen = !menuOpen;
  toggleMenu(menuOpen);
});

window.addEventListener("click", (e) => {
  if (menuOpen && !hamburgerBtn.contains(e.target) && !hamburgerMenu.contains(e.target)) {
    toggleMenu(false);
    menuOpen = false;
  }
});

updateMenu();

// ---------------- Create Event ----------------
const tagInput = document.getElementById("tagInput");
const suggestionBox = document.getElementById("tagSuggestions");
const tags = ["football","basketball","volleyball","baseball","handball","softball"];

tagInput.addEventListener("input", () => {
  const input = tagInput.value.toLowerCase();
  suggestionBox.innerHTML = "";
  if (input) {
    const filtered = tags.filter(tag => tag.toLowerCase().includes(input));
    if (filtered.length) {
      suggestionBox.style.display = "block";
      filtered.forEach(tag => {
        const div = document.createElement("div");
        div.textContent = tag;
        div.addEventListener("click", () => { tagInput.value = tag; suggestionBox.style.display="none"; });
        suggestionBox.appendChild(div);
      });
    } else suggestionBox.style.display = "none";
  } else suggestionBox.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (!suggestionBox.contains(e.target) && e.target !== tagInput) suggestionBox.style.display="none";
});

createForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newEvent = {
    host: "User1234",
    eventName: createForm.querySelector("input[placeholder='event name']").value,
    startTime: createForm.querySelector("input[name='startTime']").value,
    endTime: createForm.querySelector("input[name='endTime']").value,
    location: createForm.querySelector("input[placeholder='location']").value,
    maxParticipants: createForm.querySelector("input[name='maxParticipants']").value,
    description: textarea.value,
    tags: [tagInput.value],
    participants: [],
    comments: [],
    status: "open"
  };
  try {
    await fetch(`${SERVER_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEvent)
    });
    loadEvents();
  } catch {
    const events = JSON.parse(localStorage.getItem("events")) || [];
    events.push(newEvent);
    localStorage.setItem("events", JSON.stringify(events));
    renderEvents(events);
  }
  modal.style.display = "none";
  createForm.reset();
});

// ---------------- Event Feed ----------------
const feed = document.getElementById("event-feed");

async function loadEvents() {
  try {
    const res = await fetch(`${SERVER_URL}/events`);
    const events = await res.json();
    renderEvents(events);
  } catch {
    const localEvents = JSON.parse(localStorage.getItem("events")) || [];
    renderEvents(localEvents);
  }
}

function renderEvents(events) {
  events.forEach(event => {
    if (document.getElementById(`event-${event.id}`)) return;

    const card = document.createElement("div");
    card.className = "event-card";
    card.id = `event-${event.id}`;
    card.dataset.startTime = event.startTime;
    card.dataset.endTime = event.endTime;

    const status = updatePostStatus(event);

    card.innerHTML = `
      <div class="event-header">
        <div class="host-info">
          <span class="avatar" style="background: purple;"></span>
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
        <small>ผู้เข้าร่วม: ${event.participants.length}/${event.maxParticipants || 0}</small>
      </div>
      <div class="event-footer">
        <button class="join-btn" ${status==="closed"?"disabled":""}>${status==="closed"?"CLOSED":"JOIN"}</button>
      </div>
    `;

    const joinBtn = card.querySelector(".join-btn");
    joinBtn.addEventListener("click", (e) => { 
      e.stopPropagation(); 
      joinEvent(event, events); 
    });

    card.addEventListener("click", () => {
      if (currentUserId === event.host) {
        window.location.href = `/frontend/HTML/detailhost.html?id=${event.id}`;
      } else {
        openPopup(event);
      }
    });

    feed.appendChild(card);
  });
}

// ---------------- Post Status ----------------
function updatePostStatus(event){
  const now = new Date(new Date().toLocaleString("en-US",{timeZone:TIMEZONE}));
  const isFull = (event.maxParticipants>0 && event.participants?.length>=event.maxParticipants);
  const isExpired = event.endTime && new Date(event.endTime)<now;
  const isClosedByHost = event.status==="closed";
  event.status = (isFull || isExpired || isClosedByHost)?"closed":"open";
  return event.status;
}

// ---------------- Update Card Time ----------------
function updateEventCards(){
  const now = new Date(new Date().toLocaleString("en-US",{timeZone:TIMEZONE}));
  document.querySelectorAll(".event-card").forEach(card=>{
    const startTime = new Date(card.dataset.startTime);
    const endTime = new Date(card.dataset.endTime);
    const timeElem = card.querySelector(".time");
    const joinBtn = card.querySelector(".join-btn");
    const statusElem = card.querySelector(".status");

    const diffMs = now-startTime;
    const diffMin = Math.floor(diffMs/60000);
    const diffHour = Math.floor(diffMin/60);
    timeElem.textContent = diffHour>0?`${diffHour} ชั่วโมง`:`${diffMin} นาที`;

    if(now>endTime){ joinBtn.disabled=true; joinBtn.textContent="CLOSED"; statusElem.textContent="CLOSED"; statusElem.className="status closed";}
    else { joinBtn.disabled=false; joinBtn.textContent="JOIN"; statusElem.textContent="OPEN"; statusElem.className="status open";}
  });
}

setInterval(updateEventCards,30000);
updateEventCards();

// ---------------- Join / Unjoin ----------------
async function joinEvent(event, events){
  try{
    const action = event.participants.includes(currentUserId)?"unjoin":"join";
    const res = await fetch(`${SERVER_URL}/events/${event.id}/${action}`,{
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({userId:currentUserId})
    });
    await res.json();
    loadEvents();
  } catch {
    if(!event.participants) event.participants=[];
    if(event.participants.includes(currentUserId)){
      event.participants = event.participants.filter(u=>u!==currentUserId);
    } else { event.participants.push(currentUserId);}
    localStorage.setItem("events", JSON.stringify(events));
    renderEvents(events);
  }
}

// ---------------- Popup ----------------
const popup = document.getElementById("event-popup");
const popupJoinBtn = document.getElementById("popup-join-btn");
const commentInput = document.getElementById("popup-comment-input");
const commentSend = document.getElementById("popup-comment-send");
const commentList = document.getElementById("popup-comment-list");
const closePopupBtn = document.getElementById("close-popup");
let currentEventId=null;
let isJoined=false;

closePopupBtn.addEventListener("click",()=>{ popup.classList.add("hidden"); commentInput.value=""; commentList.innerHTML=""; currentEventId=null; isJoined=false; });

function openPopup(event){
  currentEventId = event.id;
  popup.classList.remove("hidden");

  fetch(`${SERVER_URL}/events/${currentEventId}`).then(r=>r.json()).then(data=>{
    document.getElementById("event-title").textContent = data.eventName;
    document.getElementById("event-host").textContent = data.host;
    document.getElementById("event-place").textContent = data.location || "ไม่ระบุ";
    const list = document.getElementById("participants-list");
    list.innerHTML="";
    data.participants.forEach(u=>{ const li=document.createElement("li"); li.textContent=u; list.appendChild(li); });
    isJoined = data.participants.includes(currentUserId);
    popupJoinBtn.textContent = isJoined?"UNJOIN":"JOIN";
    popupJoinBtn.disabled=false;

    commentList.innerHTML="";
    data.comments?.forEach(c=>{ const p=document.createElement("p"); p.innerHTML=`<b>${c.user}</b>: ${c.text}`; commentList.appendChild(p); });
  }).catch(()=>{
    const events = JSON.parse(localStorage.getItem("events")) || [];
    const data = events.find(ev=>ev.id===currentEventId); if(!data) return;
    document.getElementById("event-title").textContent = data.eventName;
    document.getElementById("event-host").textContent = data.host;
    document.getElementById("event-place").textContent = data.location || "ไม่ระบุ";
    const list = document.getElementById("participants-list"); list.innerHTML="";
    (data.participants||[]).forEach(u=>{ const li=document.createElement("li"); li.textContent=u; list.appendChild(li); });
    isJoined = (data.participants||[]).includes(currentUserId);
    popupJoinBtn.textContent = isJoined?"UNJOIN":"JOIN"; popupJoinBtn.disabled=false;
    commentList.innerHTML="";
    (data.comments||[]).forEach(c=>{ const p=document.createElement("p"); p.innerHTML=`<b>${c.user}</b>: ${c.text}`; commentList.appendChild(p); });
  });
}

// ---------------- Popup Join / Comment ----------------
popupJoinBtn.addEventListener("click",()=>{
  if(!currentEventId) return;
  const action = isJoined?"unjoin":"join";
  fetch(`${SERVER_URL}/events/${currentEventId}/${action}`,{ method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userId:currentUserId}) })
    .then(r=>r.json())
    .then(data=>{
      isJoined = !isJoined;
      popupJoinBtn.textContent = isJoined?"UNJOIN":"JOIN";
      const list = document.getElementById("participants-list");
      list.innerHTML="";
      data.participants.forEach(u=>{ const li=document.createElement("li"); li.textContent=u; list.appendChild(li); });
      loadEvents();
    }).catch(()=>{
      const events = JSON.parse(localStorage.getItem("events")) || [];
      const ev = events.find(ev=>ev.id===currentEventId);
      if(!ev.participants) ev.participants=[];
      if(isJoined) ev.participants=ev.participants.filter(u=>u!==currentUserId);
      else ev.participants.push(currentUserId);
      isJoined = !isJoined;
      popupJoinBtn.textContent = isJoined?"UNJOIN":"JOIN";
      localStorage.setItem("events", JSON.stringify(events));
      const list = document.getElementById("participants-list");
      list.innerHTML="";
      ev.participants.forEach(u=>{ const li=document.createElement("li"); li.textContent=u; list.appendChild(li); });
      renderEvents(events);
    });
});

commentSend.addEventListener("click",()=>{
  const text = commentInput.value.trim();
  if(!text || !currentEventId) return;
  fetch(`${SERVER_URL}/events/${currentEventId}/comments`,{
    method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({user:currentUserId,text})
  }).then(r=>r.json())
    .then(c=>{
      const p=document.createElement("p"); p.innerHTML=`<b>${c.user}</b>: ${c.text}`; commentList.appendChild(p); commentInput.value="";
    }).catch(()=>{
      const events = JSON.parse(localStorage.getItem("events"))||[];
      const ev = events.find(ev=>ev.id===currentEventId);
      if(!ev.comments) ev.comments=[];
      const comment={user:currentUserId,text}; ev.comments.push(comment); localStorage.setItem("events", JSON.stringify(events));
      const p=document.createElement("p"); p.innerHTML=`<b>${comment.user}</b>: ${comment.text}`; commentList.appendChild(p); commentInput.value="";
    });
});

// ---------------- Initial Load ----------------
loadEvents();