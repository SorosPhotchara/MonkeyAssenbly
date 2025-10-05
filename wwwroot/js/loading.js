// Universal Loading System
class LoadingScreen {
  constructor() {
    this.overlay = null;
    this.init();
  }

  init() {
    // สร้าง loading overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'loading-overlay';
    this.overlay.id = 'loading';
    this.overlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner"></div>
        <p class="loading-text">Loading...</p>
      </div>
    `;
    document.body.insertBefore(this.overlay, document.body.firstChild);
  }

  hide() {
    if (this.overlay) {
      this.overlay.classList.add('hide');
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.style.display = 'none';
        }
      }, 300);
    }
  }

  show() {
    if (this.overlay) {
      this.overlay.style.display = 'flex';
      this.overlay.classList.remove('hide');
    }
  }
}

// สร้าง instance
const loading = new LoadingScreen();

// ซ่อนเมื่อ window load เสร็จ
window.addEventListener('load', () => {
  setTimeout(() => loading.hide(), 300);
});