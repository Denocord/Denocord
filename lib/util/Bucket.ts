import { Asyncable } from "./typeUtils.ts";

type BucketFunction = () => Asyncable<void>;

/* A bucket to queue items to run at a certain frequency (useful for ratelimiting). */
class Bucket {
  private queue: BucketFunction[] = [];
  private remaining = this.maxItems;
  private lastReset = 0;
  private timeout = 0;

  /**
   * @param maxItems The maximum amount items the bucket can have in the queue.
   * @param emptyFreq The frequency to empty the bucket at.
   */
  public constructor(private maxItems: number, private emptyFreq: number) {}

  public add(func: BucketFunction, priority = false) {
    this.queue[priority ? "unshift" : "push"](func);

    // TODO(z): Actually see if there are any cases we should checkout.
    this.check().catch(() => void 0);
  }

  private async check() {
    if (this.timeout || !this.queue.length) return;
    if (this.elapsedTime < Date.now()) {
      this.lastReset = Date.now();
      this.remaining = this.maxItems;
    }

    let item: BucketFunction;
    while (
      --this.remaining &&
      (item = this.queue.shift()!) &&
      this.queue.length !== 0
    ) {
      item();
    }

    if (this.queue.length && !this.timeout) {
      this.timeout = setTimeout(() => {
        this.timeout = 0;
        this.remaining = this.maxItems;
        this.check().catch(() => void 0);
      }, Math.max(0, this.elapsedTime - Date.now()));
    }
  }

  private get elapsedTime() {
    // Add the max items to account for latency.
    return this.lastReset + this.emptyFreq + this.maxItems;
  }
}

export default Bucket;
