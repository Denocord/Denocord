type RatelimitedFunction = () => Promise<void>;

const wait = (ms: number) => new Promise((rs) => setTimeout(rs, ms));

// TODO(TTtie): test this in the real world
class SequentialBucket {
  private queue: RatelimitedFunction[] = [];
  public remaining = 1;
  public limit = 1;
  private timeout = 0;
  public lastTime = 0;
  public lastLocalTime = 0;
  public resetOn = 0;

  private processing: boolean = false;

  public add(func: RatelimitedFunction) {
    this.queue.push(func);
    this.check();
  }

  private async check() {
    if (this.processing || this.timeout) {
      return;
    }
    this.processing = true;

    if (this.queue.length === 0) return;
    if (this.remaining === 0) {
      await wait(this.resetOn - (Date.now() - this.lastTime));
    }
    while (this.remaining > 0) {
      if (this.queue.length === 0) {
        break;
      }
      const item = this.queue.shift()!;
      await item();
    }
    if (this.queue.length && !this.timeout) {
      this.timeout = setTimeout(() => {
        this.timeout = 0;
        this.processing = false;
        this.remaining = this.limit;
        this.check().catch(() => void 0);
      }, (this.resetOn - Date.now() + (this.lastLocalTime - this.lastTime))); // compensate for latency issues if any
    } else {
      this.processing = false;
    }
  }
}

export default SequentialBucket;
