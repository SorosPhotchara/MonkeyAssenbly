// --------------------------------- Tag ที่เอาไปใช้จริง --------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const SERVER_URL = "http://localhost:3000";
  let currentUserId = localStorage.getItem("userId") || "";
  let isLoggedIn = !!currentUserId;

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
  const menuItems = document.querySelectorAll(".menu h2");
  menuItems.forEach(item => item.addEventListener("click", () => {
    menuItems.forEach(el => el.classList.remove("active"));
    item.classList.add("active");
  }));

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
  const feedContainer = document.getElementById('tag-feed');

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
    tagList.innerHTML="";
    const searchLower = search.toLowerCase();
    tags.forEach(tag=>{
      if(search && !tag.name.toLowerCase().includes(searchLower)) return;
      const card = document.createElement("div");
      card.className="tag-card";
      card.textContent = tag.name;
      card.addEventListener("click", ()=>loadPostsByTag(tag.name));
      tagList.appendChild(card);
    });
  }

  if(tagSearchInput){
    tagSearchInput.addEventListener("input", e=>{
      loadTags(e.target.value.trim());
    });
  }

  // ---------------- Load posts by tag ----------------
  async function loadPostsByTag(tagName){
    if(!feedContainer) return;
    feedContainer.innerHTML="กำลังโหลด...";
    try{
      const res = await fetch(`${SERVER_URL}/posts?tag=${encodeURIComponent(tagName)}`);
      const posts = await res.json();
      renderPosts(posts);
    } catch(err){ feedContainer.innerHTML="ไม่สามารถโหลดโพสต์ได้"; console.error(err); }
  }

  function renderPosts(posts){
    if(!feedContainer) return;
    feedContainer.innerHTML="";
    posts.forEach(post=>{
      const card = document.createElement("div");
      card.className="event-card";
      card.innerHTML=`
        <div class="event-header">
          <span class="host">${post.host}</span>
          <small>${post.startTime||""}</small>
        </div>
        <div class="event-body">
          <h3>${post.name}</h3>
          <p>${post.description}</p>
        </div>
      `;
      if(isLoggedIn){
        const joinBtn = document.createElement("button");
        joinBtn.textContent = post.participants?.includes(currentUserId)?"UNJOIN":"JOIN";
        joinBtn.addEventListener("click", async ()=>{
          try{
            const action = post.participants?.includes(currentUserId)?"unjoin":"join";
            await fetch(`${SERVER_URL}/events/${post.id}/${action}`,{
              method:"PUT",
              headers:{"Content-Type":"application/json"},
              body:JSON.stringify({userId:currentUserId})
            });
            loadPostsByTag(post.tag);
          } catch(err){ alert("เกิดข้อผิดพลาด"); }
        });
        card.appendChild(joinBtn);
      }
      feedContainer.appendChild(card);
    });
  }

  // ---------------- Initial Load ----------------
  loadTags();
});