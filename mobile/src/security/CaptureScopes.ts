// One native window lock shared by short-lived owners. Serialisation prevents
// a late blur/unmount from undoing protection on the next password field.
export class CaptureScopes {
  private owners = new Set<symbol>();
  private queue: Promise<void> = Promise.resolve();
  private active = false;
  private prevent: () => Promise<void>;
  private allow: () => Promise<void>;
  constructor(prevent: () => Promise<void>, allow: () => Promise<void>) {
    this.prevent = prevent;
    this.allow = allow;
  }
  private reconcile() {
    const operation = this.queue.then(async () => {
      const wanted = this.owners.size > 0;
      if (wanted === this.active) return;
      if (wanted) await this.prevent();
      else await this.allow();
      this.active = wanted;
    });
    this.queue = operation.catch(() => {});
    return operation;
  }
  acquire() {
    const owner = Symbol();
    this.owners.add(owner);
    let released = false;
    return {
      ready: this.reconcile(),
      release: () => {
        if (released) return this.queue;
        released = true;
        this.owners.delete(owner);
        return this.reconcile();
      },
    };
  }
}
