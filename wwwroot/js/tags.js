// ---------------- Theme / Sidebar ----------------
const menuItems = document.querySelectorAll(".menu h2");
const root = document.documentElement;
const toggle = document.getElementById("toggle");
const sunIcon = document.querySelector(".toggle .bxs-sun");
const moonIcon = document.querySelector(".toggle .bx-moon");

if(localStorage.getItem("theme") === "dark") {
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

// ---------------- Hamburger & Menu ----------------
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
        addMenuItem("เข้าสู่ระบบ", () => {
            window.location.href = "/frontend/HTML/login.html";
        });
        addMenuItem("สมัครสมาชิก", () => {
            window.location.href = "/frontend/HTML/signup.html";
        });
    } else {
        addMenuItem("โปรไฟล์ของฉัน", () => {
            window.location.href = window.ProfileUrl;
        });

        addMenuItem("ออกจากระบบ", async () => {
            try {
                await fetch("/Account/Logout", { method: "POST" });
                setLoginState(false);
                alert("ออกจากระบบเรียบร้อย");
            } catch (err) {
                alert("เกิดข้อผิดพลาด: " + err.message);
            }
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


// ---------------- Login / Signup / Logout ----------------
function showLoginPage() {
    window.location.href = "/frontend/HTML/login.html";
}

function showSignupPage() {
    window.location.href = "/frontend/HTML/signup.html";
}

async function logoutUser() {
    try {
        await fetch("/Account/Logout", { method: "POST" });
        isLoggedIn = false;
        localStorage.setItem("isLoggedIn", "false");
        updateMenu();
        alert("ออกจากระบบเรียบร้อย");
    } catch (err) {
        alert("เกิดข้อผิดพลาด: " + err.message);
    }
}

// Mockup tag data (English, sports + esports, many tags)
const tags = [
  { name: "Football" },
  { name: "Basketball" },
  { name: "Volleyball" },
  { name: "Badminton" },
  { name: "Running" },
  { name: "Fitness" },
  { name: "Yoga" },
  { name: "Cycling" },
  { name: "Table Tennis" },
  { name: "Tennis" },
  { name: "Swimming" },
  { name: "Golf" },
  { name: "Baseball" },
  { name: "Softball" },
  { name: "Rugby" },
  { name: "American Football" },
  { name: "Cricket" },
  { name: "Hockey" },
  { name: "Ice Hockey" },
  { name: "Skateboarding" },
  { name: "Surfing" },
  { name: "Climbing" },
  { name: "Boxing" },
  { name: "Muay Thai" },
  { name: "Martial Arts" },
  { name: "Judo" },
  { name: "Taekwondo" },
  { name: "Karate" },
  { name: "Wrestling" },
  { name: "Snooker" },
  { name: "Bowling" },
  { name: "Darts" },
  { name: "Archery" },
  { name: "Shooting" },
  { name: "Fencing" },
  { name: "Rowing" },
  { name: "Sailing" },
  { name: "Triathlon" },
  { name: "Duathlon" },
  { name: "CrossFit" },
  { name: "Aerobic" },
  { name: "Dance" },
  { name: "Cheerleading" },
  { name: "Petanque" },
  { name: "Sepak Takraw" },
  { name: "Ultimate Frisbee" },
  { name: "Esports" },
  { name: "League of Legends" },
  { name: "Valorant" },
  { name: "Dota 2" },
  { name: "Counter-Strike" },
  { name: "Overwatch" },
  { name: "PUBG" },
  { name: "Apex Legends" },
  { name: "Rainbow Six Siege" },
  { name: "Rocket League" },
  { name: "FIFA" },
  { name: "eFootball" },
  { name: "Mobile Legends" },
  { name: "Arena of Valor" },
  { name: "Free Fire" },
  { name: "Call of Duty" },
  { name: "Fortnite" },
  { name: "Hearthstone" },
  { name: "StarCraft II" },
  { name: "Tekken" },
  { name: "Street Fighter" },
  { name: "Super Smash Bros" },
  { name: "Pokemon Unite" },
  { name: "Clash Royale" },
  { name: "Clash of Clans" },
  { name: "Brawl Stars" },
  { name: "Teamfight Tactics" },
  { name: "Auto Chess" },
  { name: "Chess" },
  { name: "Go" },
  { name: "Board Games" },
  { name: "Card Games" },
  { name: "Speed Skating" },
  { name: "Figure Skating" },
  { name: "Skiing" },
  { name: "Snowboarding" },
  { name: "Motorsport" },
  { name: "Formula 1" },
  { name: "MotoGP" },
  { name: "Drifting" },
  { name: "Kart Racing" },
  { name: "Horse Riding" },
  { name: "Fishing" },
  { name: "Hiking" },
  { name: "Camping" },
  { name: "Parkour" },
  { name: "Handball" },
  { name: "Netball" },
  { name: "Lacrosse" },
  { name: "Polo" },
  { name: "Squash" },
  { name: "Paddle Tennis" },
  { name: "Pickleball" },
  { name: "Soft Tennis" },
  { name: "Racquetball" }
];

const tagList = document.querySelector('.tag-list');
const tagSearchInput = document.getElementById('tagSearchInput');

function renderTags(search = "") {
  tagList.innerHTML = "";
  const searchLower = search.toLowerCase();
  const filtered = tags
    .map(tag => ({
      ...tag,
      match: tag.name.toLowerCase().includes(searchLower)
    }))
    .sort((a, b) => {
      if (a.match === b.match) return a.name.localeCompare(b.name, 'en');
      return a.match ? -1 : 1;
    })
    .filter(tag => tag.name.toLowerCase().includes(searchLower) || search === "");

  filtered.forEach(tag => {
    const card = document.createElement('div');
    card.className = 'tag-card';
    card.textContent = tag.name;
    tagList.appendChild(card);
  });
}

// initial render
renderTags();

// event: ค้นหาและ sort
if (tagSearchInput) {
  tagSearchInput.addEventListener('input', (e) => {
    renderTags(e.target.value.trim());
  });
}