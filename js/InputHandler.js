export class InputHandler {
  constructor(canvas) {
    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false, worldX: 0, worldY: 0 };

    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    canvas.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.down = true;
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.down = false;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  updateWorldCoords(camera) {
    this.mouse.worldX = this.mouse.x + camera.x;
    this.mouse.worldY = this.mouse.y + camera.y;
  }
}