class Bucket {
  #queue: Function[] = [];
  private remaining: number = this.tokenLimit;
  private lastReset: number = 0;
  private timeout: number = 0;

  public constructor(private tokenLimit: number, private resetIn: number) {}

  public add(func: Function, priority: boolean = false) {
    if (priority) {
      this.#queue.unshift(func);
    } else {
      this.#queue.push(func);
    }
    this.check().catch(() => void 0);
  }

  private async check() {
    if (this.timeout || !this.#queue.length) return;
    if (
      this.lastReset + this.resetIn +
          this.tokenLimit < Date.now()
    ) {
      this.lastReset = Date.now();
      this.remaining = this.tokenLimit;
    }
    while (this.remaining > 0) {
      if (this.#queue.length === 0) {
        break;
      }
      const item = this.#queue.shift()!;
      item();
      this.remaining--;
    }
    if (this.#queue.length && !this.timeout) {
      this.timeout = setTimeout(
        () => {
          this.timeout = 0;
          this.remaining = this.tokenLimit;
          this.check().catch(() => void 0);
        },
        Math.max(
          0,
          this.lastReset + this.resetIn +
            this.tokenLimit - Date.now(),
        ),
      );
    }
  }
}

export default Bucket;
