export class PerformanceViewer {
  constructor(game) {
    this.game = game;
    this.history = [];
    this.maxHistory = 60;
    this.visible = false;

    // DOM refs
    this.el = document.getElementById('perfViewer');
    this.fpsEl = document.getElementById('perfFps');
    this.avgEl = document.getElementById('perfAvg');
    this.minEl = document.getElementById('perfMin');
    this.maxEl = document.getElementById('perfMax');
    this.frameTimeEl = document.getElementById('perfFrameTime');
    this.frameBarEl = document.getElementById('perfFrameBar');
    this.botsEl = document.getElementById('perfBots');
    this.bulletsEl = document.getElementById('perfBullets');
    this.particlesEl = document.getElementById('perfParticles');
    this.cpuEl = document.getElementById('perfCpu');
    this.cpuBarEl = document.getElementById('perfCpuBar');
    this.gpuEl = document.getElementById('perfGpu');
    this.gpuBarEl = document.getElementById('perfGpuBar');
    this.zoneEl = document.getElementById('perfZone');
    this.aliveEl = document.getElementById('perfAlive');
    this.modeEl = document.getElementById('perfMode');
    this.graphCanvas = document.getElementById('perfGraph');

    this.metrics = {
      fps: { current: 0, avg: 0, min: Infinity, max: 0 },
      frameTime: 0,
      cpuTime: 0,
      gpuTime: 0,
      bots: 0,
      bullets: 0,
      particles: 0,
      zonePhase: 0,
      alive: 0,
      gameMode: 'standard',
    };

    if (this.graphCanvas) {
      this.graphCtx = this.graphCanvas.getContext('2d');
      this.graphWidth = this.graphCanvas.width;
      this.graphHeight = this.graphCanvas.height;
    }

    // Check initial visibility
    this.visible = this.el && this.el.style.display === 'block';
  }

  updateMetrics() {
    if (!this.visible) return;

    const g = this.game;
    const m = this.metrics;

    // Collect metrics
    m.fps.current = g.currentFPS || 0;
    m.frameTime = m.fps.current > 0 ? 1000 / m.fps.current : 0;
    m.bots = g.bots ? g.bots.filter(b => b.alive).length : 0;
    m.bullets = g.bullets ? g.bullets.length : 0;
    m.particles = g.particles ? g.particles.length : 0;
    m.zonePhase = g.zone ? g.zone.phase + 1 : 0;
    m.alive = g.aliveCount || 0;
    m.gameMode = g.gameMode || 'standard';

    // Estimate CPU/GPU times (rough approximation)
    const botFactor = Math.min(1, m.bots / 40);
    m.cpuTime = Math.min(m.frameTime * 0.9, 5 + (m.frameTime - 5) * botFactor * 0.7);
    m.gpuTime = Math.max(0, m.frameTime - m.cpuTime);

    // Update history
    this.history.push({
      fps: m.fps.current,
      frameTime: m.frameTime,
      time: performance.now(),
    });
    if (this.history.length > this.maxHistory) this.history.shift();

    // Update min/max – reset min if history is empty
    if (this.history.length === 0) {
      m.fps.min = Infinity;
      m.fps.max = 0;
    } else {
      const fpsValues = this.history.map(h => h.fps);
      m.fps.min = Math.min(...fpsValues);
      m.fps.max = Math.max(...fpsValues);
    }

    // Update average
    const sum = this.history.reduce((acc, h) => acc + h.fps, 0);
    m.fps.avg = this.history.length > 0 ? sum / this.history.length : 0;

    // Update DOM
    this.updateDOM();
    this.drawGraph();
  }

  updateDOM() {
    const m = this.metrics;
    const fps = m.fps.current;

    this.fpsEl.textContent = fps || '--';
    this.fpsEl.className = 'perf-value ' + this.getFPSColor(fps);

    this.avgEl.textContent = m.fps.avg.toFixed(1) || '--';
    this.minEl.textContent = m.fps.min === Infinity ? '--' : m.fps.min;
    this.maxEl.textContent = m.fps.max || '--';

    const ft = m.frameTime;
    this.frameTimeEl.textContent = ft ? ft.toFixed(1) : '--';
    const ftPct = ft ? Math.min(100, (ft / 33) * 100) : 0;
    this.frameBarEl.style.width = ftPct + '%';
    this.frameBarEl.style.background = ftPct > 80 ? '#ff3333' : ftPct > 50 ? '#ffaa00' : '#44ff88';

    this.botsEl.textContent = m.bots;
    this.bulletsEl.textContent = m.bullets;
    this.particlesEl.textContent = m.particles;

    const cpu = m.cpuTime || 0;
    const gpu = m.gpuTime || 0;
    this.cpuEl.textContent = cpu.toFixed(1);
    this.gpuEl.textContent = gpu.toFixed(1);
    const total = cpu + gpu || 1;
    this.cpuBarEl.style.width = Math.min(100, (cpu / total) * 100) + '%';
    this.gpuBarEl.style.width = Math.min(100, (gpu / total) * 100) + '%';

    this.zoneEl.textContent = m.zonePhase;
    this.aliveEl.textContent = m.alive;
    this.modeEl.textContent = this.game.gameMode === 'target' ? 'Target' : 'Std';
  }

  drawGraph() {
    if (!this.graphCtx) return;
    const ctx = this.graphCtx;
    const w = this.graphWidth;
    const h = this.graphHeight;
    const padding = 4;

    ctx.clearRect(0, 0, w, h);

    if (this.history.length < 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('— waiting for data —', w/2, h/2 + 3);
      return;
    }

    let maxFps = Math.max(...this.history.map(h => h.fps));
    maxFps = Math.max(maxFps, 30);

    const graphW = w - padding * 2;
    const graphH = h - padding * 2;

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * graphH;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.stroke();
    }

    const data = this.history.slice(-this.maxHistory);

    // FPS line
    ctx.beginPath();
    ctx.strokeStyle = '#44ff88';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(68,255,136,0.3)';
    ctx.shadowBlur = 4;
    for (let i = 0; i < data.length; i++) {
      const x = padding + (i / (this.maxHistory - 1)) * graphW;
      const y = padding + graphH - (data[i].fps / maxFps) * graphH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // fill under line
    if (data.length > 1) {
      const lastX = padding + ((data.length - 1) / (this.maxHistory - 1)) * graphW;
      const firstX = padding;
      const baseline = padding + graphH;

      ctx.beginPath();
      ctx.moveTo(firstX, baseline);
      for (let i = 0; i < data.length; i++) {
        const x = padding + (i / (this.maxHistory - 1)) * graphW;
        const y = padding + graphH - (data[i].fps / maxFps) * graphH;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(lastX, baseline);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, padding, 0, padding + graphH);
      grad.addColorStop(0, 'rgba(68,255,136,0.2)');
      grad.addColorStop(1, 'rgba(68,255,136,0.02)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // 60 FPS reference line
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 4]);
    const refY = padding + graphH - (60 / maxFps) * graphH;
    if (refY >= padding && refY <= padding + graphH) {
      ctx.beginPath();
      ctx.moveTo(padding, refY);
      ctx.lineTo(w - padding, refY);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // FPS label at end
    if (data.length > 0) {
      const last = data[data.length - 1];
      const x = padding + ((data.length - 1) / (this.maxHistory - 1)) * graphW;
      const y = padding + graphH - (last.fps / maxFps) * graphH;
      ctx.fillStyle = '#44ff88';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(Math.round(last.fps) + 'fps', x + 2, y - 1);
    }
  }

  getFPSColor(fps) {
    if (fps >= 55) return 'perf-good';
    if (fps >= 30) return 'perf-warn';
    return 'perf-bad';
  }

  toggle() {
    this.visible = !this.visible;
    if (this.el) {
      this.el.style.display = this.visible ? 'block' : 'none';
    }
    if (this.visible) {
      this.updateMetrics();
    }
  }

  show() {
    this.visible = true;
    if (this.el) this.el.style.display = 'block';
    this.updateMetrics();
  }

  hide() {
    this.visible = false;
    if (this.el) this.el.style.display = 'none';
  }
}