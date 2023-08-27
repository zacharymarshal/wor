export default class GameLoop {
  #onUpdate;
  #rafID;
  #isStopped = false;

  #lastTs = 0;
  #frame = 0;

  #frameTimer;
  #frameTimerLimit;

  constructor(onUpdate, fps = 60) {
    this.#onUpdate = onUpdate;
    this.#frameTimerLimit = Math.floor(1000 / fps);
    this.#frameTimer = this.#frameTimerLimit;
  }

  start() {
    this.#isStopped = false;
    this.#rafID = requestAnimationFrame(this.#update.bind(this));
  }

  stop() {
    this.#isStopped = true;
    cancelAnimationFrame(this.#rafID);
  }

  #update(ts) {
    if (this.#isStopped) {
      return;
    }

    const delta = Math.floor(ts - this.#lastTs);
    this.#lastTs = ts;
    if (this.#frameTimer <= this.#frameTimerLimit) {
      this.#frameTimer += delta;
    } else {
      this.#frameTimer = this.#frameTimerLimit;
      this.#onUpdate(delta, ++this.#frame);
    }

    this.#rafID = requestAnimationFrame(this.#update.bind(this));
  }
}
