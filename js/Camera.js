export class Camera {
  constructor(canvas) {
    this.x = 0;
    this.y = 0;
    this.canvas = canvas;
  }

  follow(target, smooth = 0.08) {
    const targetCX = target.x - this.canvas.width / 2;
    const targetCY = target.y - this.canvas.height / 2;
    this.x += (targetCX - this.x) * smooth;
    this.y += (targetCY - this.y) * smooth;
  }
}