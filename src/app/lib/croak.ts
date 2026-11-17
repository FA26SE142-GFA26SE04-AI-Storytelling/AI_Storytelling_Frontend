/** Tiếng ếch "ộp ộp" tổng hợp bằng Web Audio (không cần file âm thanh). Trình duyệt không hỗ trợ thì im lặng. */
let ctx: AudioContext | null = null;

export function croak() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime;
    // Hai tiếng ngắn, tiếng sau trầm hơn một chút: sóng răng cưa hạ giọng + rung 35 Hz cho tiếng "ồ ồ" + lọc bớt chói.
    [0, 0.17].forEach((delay, k) => {
      const t = t0 + delay, c = ctx!;
      const osc = c.createOscillator(), wob = c.createOscillator(), wobGain = c.createGain(), am = c.createGain(), filter = c.createBiquadFilter(), gain = c.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(k ? 200 : 230, t);
      osc.frequency.exponentialRampToValueAtTime(k ? 110 : 130, t + 0.14);
      // Rung biên độ trong khoảng 0.2–1 (0.6 ± 0.4), tách khỏi đường bao để không đổi dấu gây tiếng lách cách.
      wob.frequency.value = 35; wobGain.gain.value = 0.4; am.gain.value = 0.6;
      filter.type = "lowpass"; filter.frequency.value = 1100;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      wob.connect(wobGain).connect(am.gain);
      osc.connect(filter).connect(am).connect(gain).connect(c.destination);
      osc.start(t); wob.start(t); osc.stop(t + 0.16); wob.stop(t + 0.16);
    });
  } catch { /* không có Web Audio: bỏ qua tiếng kêu */ }
}
