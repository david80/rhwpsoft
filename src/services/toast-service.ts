export class ToastService {
  private static container: HTMLElement | null = null;

  private static getContainer(): HTMLElement {
    if (!this.container) {
      this.container = document.getElementById('toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        document.body.appendChild(this.container);
      }
    }
    return this.container;
  }

  static show(message: string, type: 'success' | 'info' | 'error' = 'info', durationMs = 3500) {
    const container = this.getContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode === container) {
          container.removeChild(toast);
        }
      }, 300);
    }, durationMs);
  }

  static success(message: string) {
    this.show(message, 'success');
  }

  static info(message: string) {
    this.show(message, 'info');
  }

  static error(message: string) {
    this.show(message, 'error', 4500);
  }
}
