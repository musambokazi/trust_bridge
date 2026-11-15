export function exitBackWindow(windowMs = 2500) {
  let first: number | null = null;
  return {
    reset() { first = null; },
    attempt(now: number) {
      if (first !== null && now >= first && now - first < windowMs) { first = null; return "exit" as const; }
      first = now;
      return "prompt" as const;
    },
  };
}
