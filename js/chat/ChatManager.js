import { ChatEngine } from './ChatEngine.js';

export class ChatManager {
  constructor() {
    this.messages = [];           // { entity, text, time, category }
    this.cooldowns = new Map();   // entity.id → last speak time (we'll use entity name as key)
    this.enabled = true;
    this.maxMessages = 8;
    this.messageLife = 2.5;       // seconds
    this.cooldownTime = 4;        // seconds between messages per bot
  }

  /**
   * Add a message to the queue.
   */
  addMessage(entity, text, category) {
    // Remove oldest if at max
    if (this.messages.length >= this.maxMessages) {
      this.messages.shift();
    }

    this.messages.push({
      entity,
      text,
      time: performance.now(),
      category,
    });

    // Update cooldown
    this.cooldowns.set(entity.name, performance.now());
  }

  /**
   * Called every frame by Game.js.
   */
  update(game) {
    if (!this.enabled) return;

    const now = performance.now();

    // Check all alive bots
    for (const bot of game.bots) {
      if (!bot.alive) continue;

      // Check cooldown
      const lastSpeak = this.cooldowns.get(bot.name) || 0;
      if (now - lastSpeak < this.cooldownTime * 1000) continue;

      // Should the bot speak now?
      const result = ChatEngine.maybeSpeak(bot, game);
      if (result) {
        this.addMessage(bot, result.text, result.category);
      }
    }

    // Clean up expired messages
    this.messages = this.messages.filter(msg => {
      const elapsed = (now - msg.time) / 1000;
      return elapsed < this.messageLife && msg.entity && msg.entity.alive;
    });
  }
}