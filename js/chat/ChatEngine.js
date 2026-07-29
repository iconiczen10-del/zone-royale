import { MESSAGES } from './ChatMessages.js';

export class ChatEngine {
  /**
   * Decides whether a bot should speak and returns a message or null.
   * @param {Object} bot - The bot entity
   * @param {Object} game - The game state
   * @returns {Object|null} { text, category } or null
   */
  static maybeSpeak(bot, game) {
    if (!bot.alive) return null;

    const now = performance.now();
    const ai = bot.ai;

    // What category best describes this bot's current situation?
    let category = null;

    // Priority order (highest first)
    if (bot.hp <= 0) {
      category = 'death';
    } else if (bot.hp < 30 && Math.random() < 0.3) {
      category = 'lowHP';
    } else if (bot.lastDamageTime && (now - bot.lastDamageTime) < 500 && Math.random() < 0.4) {
      category = 'hurt';
    } else if (bot.healing) {
      category = 'heal';
    } else if (ai.state === 'flee_zone') {
      category = 'fleeZone';
    } else if (ai.state === 'engage') {
      category = Math.random() < 0.5 ? 'engage' : 'chase';
    } else if (ai.state === 'chase') {
      if (ai.target && ai.target.isPlayer && Math.random() < 0.5) {
        category = 'playerSpotted';
      } else {
        category = 'chase';
      }
    } else if (ai.state === 'loot') {
      category = 'loot';
    } else if (ai.state === 'wander') {
      category = 'wander';
    }

    // Check if bot is in hunt mode (THE Target)
    if (bot.huntEndTime && now < bot.huntEndTime && Math.random() < 0.4) {
      category = 'hunt';
    }

    if (!category || !MESSAGES[category]) return null;

    // Pick a random message from the category
    const messages = MESSAGES[category];
    const text = messages[Math.floor(Math.random() * messages.length)];

    return { text, category };
  }
}