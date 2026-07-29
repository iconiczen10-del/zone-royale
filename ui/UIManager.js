import { WeaponDefs } from '../js/WeaponDefs.js';
import { CONFIG, ZONE_PHASES } from '../js/config.js';
import { LootSystem } from '../js/LootSystem.js';

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

    // Performance Viewer
    this.perfViewer = document.getElementById('perfViewer');
    this.perfCloseBtn = document.getElementById('perfCloseBtn');
    this.perfToggleBtn = document.getElementById('perfToggleBtn');
    this.perfVisible = false;

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

    // Performance Viewer toggle (ON/OFF) - stays persistent
    if (this.perfToggleBtn) {
      this.perfToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePerfViewer();
        this.settingsDropdown.style.display = 'none';
      });
    }

    // Close button on PV panel
    if (this.perfCloseBtn) {
      this.perfCloseBtn.addEventListener('click', () => {
        this.hidePerfViewer();
      });
    }
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

  updateFPSDisplay(game) {
    if (this.fpsDisplay) {
      if (game.settings.showFPS) {
        this.fpsDisplay.style.display = 'block';
        this.fpsDisplay.textContent = `FPS: ${game.currentFPS}`;
      } else {
        this.fpsDisplay.style.display = 'none';
      }
    }
  }

  togglePerfViewer() {
    if (this.perfVisible) {
      this.hidePerfViewer();
    } else {
      this.showPerfViewer();
    }
  }

  showPerfViewer() {
    if (this.perfViewer) {
      this.perfViewer.style.display = 'block';
      this.perfVisible = true;
      if (this.perfToggleBtn) {
        this.perfToggleBtn.textContent = 'ON';
        this.perfToggleBtn.className = 'toggle-btn on';
      }
      if (window.game && window.game.perfViewer) {
        window.game.perfViewer.visible = true;
        window.game.perfViewer.updateMetrics();
      }
    }
  }

  hidePerfViewer() {
    if (this.perfViewer) {
      this.perfViewer.style.display = 'none';
      this.perfVisible = false;
      if (this.perfToggleBtn) {
        this.perfToggleBtn.textContent = 'OFF';
        this.perfToggleBtn.className = 'toggle-btn';
      }
      if (window.game && window.game.perfViewer) {
        window.game.perfViewer.visible = false;
      }
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
}