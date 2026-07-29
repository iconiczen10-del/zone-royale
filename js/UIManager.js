import { WeaponDefs } from './WeaponDefs.js';
import { CONFIG, ZONE_PHASES } from './config.js';
import { LootSystem } from './LootSystem.js';

export class UIManager {
  constructor() {
    this.inventoryScreen = document.getElementById('inventoryScreen');
    this.invContainer = document.getElementById('invContainer');
    this.gameOverDiv = document.getElementById('gameOver');
    this.goTitle = document.getElementById('goTitle');
    this.goPlacement = document.getElementById('goPlacement');
    this.closeInvBtn = document.getElementById('closeInvBtn');
    this.closeInvBtn.addEventListener('click', () => this.closeInventory(null));

    this.matchReportDiv = document.getElementById('matchReport');
    this.reportTitle = document.getElementById('reportTitle');
    this.reportContent = document.getElementById('reportContent');

    // Settings gear
    this.settingsGear = document.getElementById('settingsGear');
    this.settingsDropdown = document.getElementById('settingsDropdown');
    this.fpsDisplay = document.getElementById('fpsDisplay');
    this.fpsToggleBtn = document.getElementById('fpsToggleBtn');

    if (this.settingsGear) {
      this.settingsGear.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.settingsDropdown) {
          this.settingsDropdown.style.display =
            this.settingsDropdown.style.display === 'block' ? 'none' : 'block';
        }
      });
    }

    document.addEventListener('click', () => {
      if (this.settingsDropdown) this.settingsDropdown.style.display = 'none';
    });
  }

  setupFPSToggle(game) {
    if (this.fpsToggleBtn) {
      this.fpsToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        game.settings.showFPS = !game.settings.showFPS;
        this.fpsToggleBtn.textContent = game.settings.showFPS ? 'ON' : 'OFF';
        this.fpsToggleBtn.className = 'toggle-btn' + (game.settings.showFPS ? ' on' : '');
      });
    }
  }

  showInventory(game) {
    this.inventoryScreen.style.display = 'flex';
    game.showInventory = true;
    this.renderInventory(game);
  }

  closeInventory(game) {
    this.inventoryScreen.style.display = 'none';
    if (game) game.showInventory = false;
  }

  toggleInventory(game) {
    if (this.inventoryScreen.style.display === 'flex') {
      this.closeInventory(game);
    } else {
      this.showInventory(game);
    }
  }

  renderInventory(game) {
    const p = game.player;
    let html = '<div style="font-weight:bold; margin-bottom:10px;">WEAPONS</div>';
    for (let i = 0; i < p.weapons.length; i++) {
      const w = p.weapons[i];
      const def = WeaponDefs[w.type];
      const selected = i === p.currentWeapon ? ' (equipped)' : '';
      html += `<div class="inv-slot">
        <span class="inv-weapon-name" style="color:${def.color}">${def.name}${selected}</span>
        <span class="inv-ammo">Ammo: ${w.ammo} / ${w.reserveAmmo === Infinity ? '∞' : w.reserveAmmo}</span>
        <button class="inv-btn" data-action="dropWeapon" data-idx="${i}" ${w.type==='fists'?'disabled':''}>Drop</button>
      </div>`;
    }
    html += `<div style="font-weight:bold; margin-top:15px;">ITEMS</div>
      <div class="inv-slot"><span>Bandages: ${p.bandages}</span><button class="inv-btn" data-action="dropBandages" ${p.bandages<=0?'disabled':''}>Drop 1</button></div>
      <div class="inv-slot"><span>Medkits: ${p.medkits}</span><button class="inv-btn" data-action="dropMedkits" ${p.medkits<=0?'disabled':''}>Drop 1</button></div>
      <div class="inv-slot"><span>Armor: ${p.armor}</span><button class="inv-btn" data-action="dropArmor" ${p.armor<=0?'disabled':''}>Drop</button></div>`;

    const s = p.stats;
    const accuracy = s.shotsFired > 0 ? ((s.shotsHit / s.shotsFired)*100).toFixed(1) : '0.0';
    html += `<div style="font-weight:bold; margin-top:20px;">PLAYER STATS</div>
      <div class="stats-row">
        <div class="stat"><div class="stat-value">${s.kills}</div><div class="stat-label">Kills</div></div>
        <div class="stat"><div class="stat-value">${s.damageDealt}</div><div class="stat-label">DMG Dealt</div></div>
        <div class="stat"><div class="stat-value">${s.damageTaken}</div><div class="stat-label">DMG Taken</div></div>
        <div class="stat"><div class="stat-value">${accuracy}%</div><div class="stat-label">Accuracy</div></div>
        <div class="stat"><div class="stat-value">${s.healsUsed}</div><div class="stat-label">Heals Used</div></div>
      </div>`;
    this.invContainer.innerHTML = html;

    this.invContainer.querySelectorAll('[data-action="dropWeapon"]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        LootSystem.dropWeapon(game.player, idx, game);
        this.renderInventory(game);
      };
    });
    this.invContainer.querySelector('[data-action="dropBandages"]').onclick = () => {
      LootSystem.dropHeal(game.player, 'bandages', game);
      this.renderInventory(game);
    };
    this.invContainer.querySelector('[data-action="dropMedkits"]').onclick = () => {
      LootSystem.dropHeal(game.player, 'medkits', game);
      this.renderInventory(game);
    };
    this.invContainer.querySelector('[data-action="dropArmor"]').onclick = () => {
      LootSystem.dropArmor(game.player, game);
      this.renderInventory(game);
    };
  }

  showMatchReport(stats) {
    this.closeInventory(null);
    const title = this.reportTitle;
    if (stats.won) {
      title.textContent = '🏆 WINNER WINNER! 🏆';
      title.style.color = '#ffcc00';
    } else {
      title.textContent = '☠️ ELIMINATED';
      title.style.color = '#ff4444';
    }

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    let weaponListHtml = '';
    if (stats.weaponKills && Object.keys(stats.weaponKills).length > 0) {
      weaponListHtml = Object.entries(stats.weaponKills).map(([wep, kills]) =>
        `<div class="report-weapon-entry"><strong>${wep.charAt(0).toUpperCase() + wep.slice(1)}</strong>: ${kills} kills</div>`
      ).join('');
    } else {
      weaponListHtml = '<div class="report-weapon-entry">No kills with weapons</div>';
    }

    const content = `
      <div class="report-section">
        <h2>📊 Overall</h2>
        <div class="report-row"><span>Placement</span><span>#${stats.placement} of ${stats.totalPlayers}</span></div>
        <div class="report-row"><span>Match Duration</span><span>${formatTime(stats.matchDuration)}</span></div>
        <div class="report-row"><span>Game Mode</span><span>${stats.gameMode === 'target' ? 'THE Target' : 'Standard'}</span></div>
        <div class="report-row"><span>Bot Count</span><span>${stats.botCount}</span></div>
        <div class="report-row"><span>Distance Travelled</span><span>${stats.distanceTravelled} px</span></div>
        <div class="report-row"><span>Zone Phases Survived</span><span>${stats.zonePhases} / ${ZONE_PHASES.length}</span></div>
      </div>
      <div class="report-section">
        <h2>🎯 Combat</h2>
        <div class="report-row"><span>Kills</span><span>${stats.kills}</span></div>
        <div class="report-row"><span>Damage Dealt</span><span>${stats.damageDealt}</span></div>
        <div class="report-row"><span>Damage Taken</span><span>${stats.damageTaken}</span></div>
        <div class="report-row"><span>Shots Fired</span><span>${stats.shotsFired}</span></div>
        <div class="report-row"><span>Shots Hit</span><span>${stats.shotsHit}</span></div>
        <div class="report-row"><span>Accuracy</span><span>${stats.accuracy}%</span></div>
        <div class="report-row"><span>Heals Used</span><span>${stats.healsUsed}</span></div>
        <div class="report-row"><span>Favourite Weapon</span><span>${stats.favouriteWeapon}</span></div>
      </div>
      <div class="report-section">
        <h2>🔫 Weapons Used</h2>
        <div class="report-weapon-list">${weaponListHtml}</div>
      </div>
      ${stats.gameMode === 'target' ? `
      <div class="report-section">
        <h2>🎯 The Target</h2>
        <div class="report-row"><span>Pings Received</span><span>${stats.pingsReceived}</span></div>
        <div class="report-row"><span>Time Spotted</span><span>${stats.timeSpotted} sec</span></div>
      </div>` : ''}
      <div class="report-section">
        <h2>🤖 Top Killer Bot</h2>
        <div class="report-row"><span>${stats.topBotName}</span><span>${stats.topBotKills} kills</span></div>
      </div>
    `;

    this.reportContent.innerHTML = content;
    this.matchReportDiv.style.display = 'flex';
  }

  drawHUD(game) {
    const ctx = game.renderer.ctx;
    const p = game.player;

    // FPS Counter (if enabled)
    if (this.fpsDisplay) {
      if (game.settings.showFPS) {
        this.fpsDisplay.style.display = 'block';
        this.fpsDisplay.textContent = `FPS: ${game.currentFPS}`;
      } else {
        this.fpsDisplay.style.display = 'none';
      }
    }

    const hudX = 20, hudY = game.canvas.height - 130;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(hudX-5, hudY-5, 260, 125);
    ctx.strokeStyle = '#333'; ctx.strokeRect(hudX-5, hudY-5, 260, 125);

    ctx.fillStyle = '#333'; ctx.fillRect(hudX, hudY, 200, 18);
    const hpPct = p.hp/p.maxHp;
    ctx.fillStyle = hpPct>0.5?'#44cc44':hpPct>0.25?'#ccaa00':'#cc3333'; ctx.fillRect(hudX, hudY, 200*hpPct, 18);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'left'; ctx.fillText(`HP: ${Math.ceil(p.hp)}/${p.maxHp}`, hudX+5, hudY+13);
    ctx.fillStyle = '#333'; ctx.fillRect(hudX, hudY+24, 200, 14);
    const arPct = p.armor/p.maxArmor;
    ctx.fillStyle = '#4488ff'; ctx.fillRect(hudX, hudY+24, 200*arPct, 14);
    ctx.fillStyle = '#fff'; ctx.font = '11px Arial'; ctx.fillText(`Armor: ${Math.ceil(p.armor)}`, hudX+5, hudY+35);
    const w = p.currentWeaponData, wDef = p.currentWeaponDef;
    ctx.fillStyle = wDef.color; ctx.font = 'bold 14px Arial'; ctx.fillText(wDef.name, hudX, hudY+58);
    ctx.fillStyle = '#ccc'; ctx.font = '12px Arial';
    if (w.type !== 'fists') ctx.fillText(`Ammo: ${w.ammo}/${w.reserveAmmo}`, hudX, hudY+74);
    else ctx.fillText('Melee', hudX, hudY+74);
    if (p.reloading) { ctx.fillStyle = '#ffaa00'; ctx.fillText('RELOADING...', hudX+100, hudY+58); }
    ctx.fillStyle = '#aaa'; ctx.font = '11px Arial';
    ctx.fillText(`🩹:${p.bandages} 💊:${p.medkits}`, hudX, hudY+92);
    ctx.fillText(`Weapons: ${p.weapons.map(w2 => WeaponDefs[w2.type].name).join(', ')}`, hudX, hudY+106);

    const stats = p.stats;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(game.canvas.width - 180, 10, 170, 60);
    ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'right';
    ctx.fillText(`Kills: ${stats.kills}   DMG: ${stats.damageDealt}`, game.canvas.width-15, 30);
    ctx.fillText(`Accuracy: ${stats.shotsFired ? (stats.shotsHit/stats.shotsFired*100).toFixed(1) : '0.0'}%`, game.canvas.width-15, 48);

    const zone = game.zone;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(game.canvas.width/2-140, 8, 280, 50);
    ctx.strokeStyle = '#333'; ctx.strokeRect(game.canvas.width/2-140, 8, 280, 50);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
    ctx.fillText(`Alive: ${game.aliveCount}/${game.botCount+1}`, game.canvas.width/2, 26);
    if (zone.phase < ZONE_PHASES.length) {
      const phase = ZONE_PHASES[zone.phase];
      if (!zone.shrinking) ctx.fillText(`Zone shrinks in: ${Math.ceil(phase.delay-zone.phaseTimer)}s (Phase ${zone.phase+1}/${ZONE_PHASES.length})`, game.canvas.width/2, 46);
      else ctx.fillText(`⚠️ SHRINKING! ${Math.ceil(phase.shrinkTime-zone.shrinkTimer)}s left`, game.canvas.width/2, 46);
    } else ctx.fillText('FINAL ZONE - GET TO CENTER!', game.canvas.width/2, 46);

    ctx.textAlign = 'right';
    for (let i=0; i<game.killFeed.length; i++) {
      const kf = game.killFeed[i], age = (performance.now()-kf.time)/1000, alpha = age>4? 1-(age-4)/2 : 1;
      if (alpha<=0) continue;
      const yy = 70 + i*22;
      ctx.fillStyle = `rgba(0,0,0,${0.6*alpha})`; ctx.fillRect(game.canvas.width-270, yy-12, 260, 20);
      ctx.font = '11px Arial';
      ctx.fillStyle = kf.killer==='You'?'#44aaff':kf.killer==='Zone'?'#4488ff':'#ffaa44';
      ctx.globalAlpha = alpha; ctx.fillText(`${kf.killer} ⟶ ${kf.victim}`, game.canvas.width-18, yy+2); ctx.globalAlpha = 1;
    }

    this.drawMinimap(game);

    if (p.alive) {
      let nearby = false;
      for (const item of game.lootItems) if ((p.x-item.x)**2+(p.y-item.y)**2 < 45**2) { nearby = true; break; }
      for (const crate of game.crates) if (!crate.opened && (p.x-crate.x)**2+(p.y-crate.y)**2 < 50**2) { nearby = true; break; }
      if (nearby) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(game.canvas.width/2-60, game.canvas.height-160, 120, 25);
        ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.fillText('[E] Pick up loot', game.canvas.width/2, game.canvas.height-143);
      }
    }
    if (p.damageFlash > 0) {
      ctx.fillStyle = `rgba(255,0,0,${p.damageFlash*0.03})`; ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    }
    if (p.alive && game.zone.isOutside(p)) {
      ctx.fillStyle = `rgba(0,100,255,${0.1+Math.sin(performance.now()/200)*0.05})`; ctx.fillRect(0,0,game.canvas.width,game.canvas.height);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ff4444'; ctx.font = 'bold 20px Arial';
      ctx.fillText('⚠️ OUTSIDE SAFE ZONE - TAKING DAMAGE ⚠️', game.canvas.width/2, 85);
    }
  }

  drawMinimap(game) {
    const ctx = game.renderer.ctx;
    const mmSize = 150, mmX = 12, mmY = 12, scale = mmSize/CONFIG.MAP_SIZE;
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(mmX, mmY, mmSize, mmSize);
    ctx.strokeStyle = '#555'; ctx.strokeRect(mmX, mmY, mmSize, mmSize);
    ctx.fillStyle = '#4a4a3a';
    for (const b of game.buildings) ctx.fillRect(mmX+b.x*scale, mmY+b.y*scale, Math.max(2,b.w*scale), Math.max(2,b.h*scale));
    ctx.strokeStyle = 'rgba(50,150,255,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(mmX+game.zone.cx*scale, mmY+game.zone.cy*scale, game.zone.currentRadius*scale, 0, Math.PI*2); ctx.stroke();
    if (!game.zone.shrinking && game.zone.phase < ZONE_PHASES.length) {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(mmX+game.zone.nextCx*scale, mmY+game.zone.nextCy*scale, game.zone.targetRadius*scale, 0, Math.PI*2); ctx.stroke();
    }
    for (const bot of game.bots) if (bot.alive) { ctx.fillStyle = '#ff4444'; ctx.fillRect(mmX+bot.x*scale-1, mmY+bot.y*scale-1, 3, 3); }
    if (game.player.alive) {
      ctx.fillStyle = '#44aaff'; ctx.beginPath(); ctx.arc(mmX+game.player.x*scale, mmY+game.player.y*scale, 3, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#88ccff'; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(mmX+game.player.x*scale, mmY+game.player.y*scale);
      ctx.lineTo(mmX+(game.player.x+Math.cos(game.player.angle)*100)*scale, mmY+(game.player.y+Math.sin(game.player.angle)*100)*scale); ctx.stroke();
    }

    const now = performance.now();
    if (game.pingPulseStart && now - game.pingPulseStart < CONFIG.PING_PULSE_DURATION * 1000) {
      const elapsed = (now - game.pingPulseStart) / 1000;
      const maxRadius = mmSize * 0.2;
      const radius = (elapsed / CONFIG.PING_PULSE_DURATION) * maxRadius;
      const alpha = 1 - (elapsed / CONFIG.PING_PULSE_DURATION);
      ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mmX + game.pingPulsePos.x * scale, mmY + game.pingPulsePos.y * scale, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}