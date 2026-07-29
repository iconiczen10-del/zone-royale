# ⚔️ Zone Royale (v1.9.1.1)

[![Version](https://img.shields.io/badge/version-1.9.1-brightgreen.svg)](https://github.com/iconiczen10-del/zone-royale)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20Browser-orange.svg)](#)
[![Stack](https://img.shields.io/badge/tech-Vanilla%20JS%20%7C%20HTML5%20Canvas%20%7C%20Node.js-informational.svg)](#)

**Zone Royale** is an action-packed 2D top-down battle royale game built with pure vanilla JavaScript, HTML5 Canvas, and Web Audio API synthesizer algorithms. Drop into a massive 4800×4800 grid battlefield, loot weapons and medical items from crates, survive the shrinking safe zone, and battle up to 50 intelligent AI bots to become the last survivor standing!

---

## 🌟 Key Features

* **🎮 Dynamic Gameplay Modes:**
  * **Standard Mode:** Classic battle royale featuring 15 to 50 bots battling each other and the player.
  * **THE Target Mode:** A high-intensity survival mode where you are the target! AI bots ping your location every 10 seconds for 5 seconds and prioritize hunting you down with an 80% direct focus rate.
* **🤖 Autonomous AI Bots with Dynamic Speech Chat System:**
  * Bots navigate, search buildings, loot crates, manage weapons, use health kits, avoid shrinking storm zones, and engage in tactical firefights.
  * **Bot Speech Bubbles & Chat Engine:** Bots talk in real-time during fights, retreats, kills, and low health states using contextual speech bubbles.
* **🔫 Arsenal of Weapons:**
  * **Fists:** Melee weapon with fast attack speed.
  * **Pistol:** Reliable sidearm with moderate range.
  * **Shotgun:** 5-pellet close-range blast.
  * **Shotgun Pro:** Heavy-duty 15-pellet tactical devastator.
  * **Rifle:** Rapid-fire assault rifle for sustained engagements.
  * **Sniper:** High-precision long-range rifle capable of massive single-shot damage.
* **🔊 Real-Time Procedural Web Audio Synthesizer:**
  * Zero external sound asset files needed! All sound effects—gunshots, reloads, healing, crate openings, zone hums, hit markers, and kill alerts—are synthesized on the fly using the Web Audio API with spatial panning and stereo reverb.
* **🗺️ Massive Map & Zone System:**
  * 4800×4800 unit arena featuring buildings, cover, trees, bushes, and loot crates.
  * 5-phase shrinking safe zone that forces players into intense final circle encounters.
* **📊 Comprehensive Match Performance Analytics:**
  * Full post-match summary displaying total kills, damage dealt/taken, accuracy percentage, distance traveled, favorite weapon, top killer bot, zone phases survived, and match duration.
* **⚙️ Performance Controls & Modern UI:**
  * Built-in FPS counter toggle, settings gear modal, minimap, live kill feed, and tabbed inventory management screen.

---

## 🎮 Game Controls

| Key / Input | Action |
| :--- | :--- |
| **`W` `A` `S` `D`** / **Arrow Keys** | Move character |
| **Mouse Cursor** | Aim direction |
| **Left Click** | Fire weapon |
| **`R`** | Reload active weapon |
| **`F`** | Use healing item (Bandage / Medkit) |
| **`E`** | Pick up ground loot / Open supply crates |
| **`1` - `4`** | Select weapon inventory slots |
| **`Tab`** | Toggle Inventory & Player Stats screen |

---

## 🕹️ Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* NPM (included with Node.js)

### Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/iconiczen10-del/zone-royale.git
   cd zone-royale
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm start
   ```

4. **Open in browser:**
   Navigate to `http://localhost:3000` to launch the game.

---

## 🏗️ Project Architecture & Directory Structure

Zone Royale follows a modular single-responsibility design pattern across clean ES modules:

```
├── index.html                # Main game window & HTML overlay elements
├── style.css                 # HUD, inventory, modal, and menu styling
├── server.js                 # Express web server for serving static assets
├── package.json              # Dependencies and script definitions
├── js/
│   ├── main.js               # Application bootstrapper
│   ├── Game.js               # Main game loop orchestration & state controller
│   ├── Player.js             # Player movement, inventory, input handling
│   ├── Bot.js                # AI Bot entity, state machine, and decision logic
│   ├── BotAI.js              # Bot targeting, pathing, & zone evasion algorithms
│   ├── Entity.js             # Base class for all physical game entities
│   ├── Camera.js             # Viewport camera following player movement
│   ├── CombatSystem.js       # Bullet trajectories, damage calculations, hitboxes
│   ├── CollisionSystem.js    # Circle/AABB collision checks for terrain/crates
│   ├── LootSystem.js         # Item spawns, crate management, loot pickup logic
│   ├── MapGenerator.js       # Procedural placement of buildings, trees, & crates
│   ├── SpawnManager.js       # Player & Bot spawn point separation logic
│   ├── ZoneManager.js        # Shrinking storm radius, phase timer, & damage
│   ├── SoundManager.js       # Web Audio API sound generator & spatial audio
│   ├── UIManager.js          # HUD rendering, kill feed, match summary, FPS count
│   ├── InputHandler.js       # Key and mouse input listener bindings
│   ├── WeaponDefs.js         # Weapon definitions, fire rates, spread, damage
│   ├── WeaponActions.js      # Shooting logic, reloading, ammo management
│   ├── config.js             # Global game constants, map sizes, zone parameters
│   └── chat/                 # AI Bot Chat System
│       ├── ChatManager.js    # Chat bubble queue & trigger dispatching
│       ├── ChatEngine.js     # State-based message selector & probability engine
│       ├── ChatMessages.js   # Bot dialogue trees & contextual speech lines
│       └── RenderChat.js     # Speech bubble visual canvas overlay rendering
```

---

## 📜 Version Changelog

* **v1.9.1**
  * Added FPS counter and quick-access Settings Gear UI.
  * Added toggle button to easily enable/disable FPS overlay.
* **v1.9.0C**
  * Introduced full Bot Speech & Chat Engine with 4 dedicated chat modules.
  * Bots speak via speech bubbles based on state (wandering, combat, injured, kill celebration).
* **v1.8.7A**
  * Full match report panel with stats: kills, damage dealt/taken, accuracy, favorite weapon, top killer bot, and distance traveled.
* **v1.8.6A**
  * Added "THE Target" mode location ping mechanic (bots pinged player location every 10s for 5s duration with minimap pulse alerts).
* **v1.8.5A**
  * Introduced "THE Target" game mode focusing 80% bot aggressive behavior directly towards the player.
* **v1.8.0MPC**
  * Massive codebase refactoring into modular single-purpose JS components.
* **v1.7.1U**
  * Web Audio API spatial audio overhaul with procedural gunshots, environmental alerts, and stereo directionality.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
