export class SoundManager {
  constructor() {
    this.ctx = null;
    this.listener = null;   // for stereo panning
  }

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.listener) {
      this.listener = this.ctx.listener;
    }
  }

  // Helper to create stereo panner
  _panner(sourceX, sourceY, camX, camY) {
    if (!this.ctx || !this.listener) return null;
    const panner = this.ctx.createStereoPanner();
    // Simple pan: map x difference normalized to [-1, 1]
    const dx = (sourceX - camX) / 1000;  // sensitivity
    const pan = Math.max(-1, Math.min(1, dx * 0.7));
    panner.pan.value = pan;
    return panner;
  }

  // Play a generic sound with optional source position for panning
  play(type, sourceX = null, sourceY = null, camX = null, camY = null) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const connectToDestination = (node) => {
      if (sourceX != null && camX != null) {
        const panner = this._panner(sourceX, sourceY, camX, camY);
        if (panner) {
          node.connect(panner);
          panner.connect(this.ctx.destination);
          return;
        }
      }
      node.connect(this.ctx.destination);
    };

    // ────────────────────────────────────────
    //  WEAPON SOUNDS
    // ────────────────────────────────────────
    switch (type) {
      case 'shoot_pistol': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.06);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.08);
        // extra metallic ring
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, now);
        osc2.frequency.exponentialRampToValueAtTime(2000, now + 0.03);
        gain2.gain.setValueAtTime(0.04, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc2.connect(gain2);
        connectToDestination(gain2);
        osc2.start(now);
        osc2.stop(now + 0.04);
        break;
      }

      case 'shoot_shotgun': {
        // Low powerful blast + noise
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.15);
        // noise burst
        const noise = this.ctx.createBufferSource();
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.1, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        noise.connect(noiseGain);
        connectToDestination(noiseGain);
        noise.start(now);
        noise.stop(now + 0.1);
        break;
      }

      case 'shoot_shotgunPro': {
        // Even deeper, longer
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.25);
        // noise tail
        const noise2 = this.ctx.createBufferSource();
        const buf2 = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
        const d2 = buf2.getChannelData(0);
        for (let i = 0; i < d2.length; i++) d2[i] = Math.random() * 2 - 1;
        noise2.buffer = buf2;
        const noise2Gain = this.ctx.createGain();
        noise2Gain.gain.setValueAtTime(0.15, now);
        noise2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        noise2.connect(noise2Gain);
        connectToDestination(noise2Gain);
        noise2.start(now);
        noise2.stop(now + 0.15);
        break;
      }

      case 'shoot_rifle': {
        // Sharp crack with high component
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.06);
        // mechanical click
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(400, now + 0.02);
        gain2.gain.setValueAtTime(0.03, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc2.connect(gain2);
        connectToDestination(gain2);
        osc2.start(now + 0.02);
        osc2.stop(now + 0.05);
        break;
      }

      case 'shoot_sniper': {
        // Deep boom with echo
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.3);
        // Echo (delayed)
        const echo = this.ctx.createOscillator();
        const echoGain = this.ctx.createGain();
        echo.type = 'sawtooth';
        echo.frequency.setValueAtTime(90, now + 0.2);
        echo.frequency.exponentialRampToValueAtTime(30, now + 0.4);
        echoGain.gain.setValueAtTime(0.1, now + 0.2);
        echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        echo.connect(echoGain);
        connectToDestination(echoGain);
        echo.start(now + 0.2);
        echo.stop(now + 0.4);
        break;
      }

      case 'shoot_fists': {
        // Whoosh
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      // ────────────────────────────────────────
      //  IMPACT / DAMAGE
      // ────────────────────────────────────────
      case 'hit': {
        // Low thud with pitch based on damage (from caller, if we pass extra param)
        // We'll use a default damage of 20 for generic hit
        const damage = arguments[1] || 20;
        const pitch = 200 + damage * 2;   // 200-340
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pitch, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }

      case 'kill': {
        // Deep sting
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.45);
        // High harmonic
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(800, now);
        osc2.frequency.exponentialRampToValueAtTime(120, now + 0.3);
        gain2.gain.setValueAtTime(0.07, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc2.connect(gain2);
        connectToDestination(gain2);
        osc2.start(now);
        osc2.stop(now + 0.3);
        break;
      }

      case 'player_hit': {
        // Alarming high tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }

      // ────────────────────────────────────────
      //  ENVIRONMENT / UI
      // ────────────────────────────────────────
      case 'zone_warning': {
        // Low pulsing hum
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.setTargetAtTime(0.08, now, 0.1);
        gain.gain.setTargetAtTime(0.05, now + 0.15, 0.1);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      }

      case 'zone_shrinking': {
        // Rising alarm
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.5);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      }

      case 'crate_open': {
        // Wooden creak + chime
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.15);
        // Chime
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1500, now + 0.05);
        osc2.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
        gain2.gain.setValueAtTime(0.07, now + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc2.connect(gain2);
        connectToDestination(gain2);
        osc2.start(now + 0.05);
        osc2.stop(now + 0.2);
        break;
      }

      case 'heal': {
        // Soft beep sequence
        for (let i = 0; i < 3; i++) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const t = now + i * 0.15;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600 + i * 100, t);
          gain.gain.setValueAtTime(0.06, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          osc.connect(gain);
          connectToDestination(gain);
          osc.start(t);
          osc.stop(t + 0.1);
        }
        break;
      }

      case 'reload': {
        // Mechanical clack
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(500, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }

      case 'low_ammo': {
        // Quick click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.03);
        break;
      }

            case 'zone_dmg': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      
      default:
        // Fallback beep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        connectToDestination(gain);
        osc.start(now);
        osc.stop(now + 0.1);
    }
  }
}