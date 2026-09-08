(() => {
  const canvas = document.querySelector('.field');
  const stage = document.querySelector('.stage');
  const products = [...document.querySelectorAll('.product[data-product]')];
  if (!canvas || !stage || !products.length) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let last = 0;

  const palette = {
    line: 'rgba(126, 134, 145, .20)',
    lineStrong: 'rgba(157, 165, 176, .38)',
    faint: 'rgba(112, 120, 131, .13)',
    point: 'rgba(184, 190, 199, .48)',
    orange: 'rgba(244, 91, 52, .92)',
    orangeSoft: 'rgba(244, 91, 52, .42)',
  };

  const nodes = Array.from({ length: 16 }, (_, i) => ({
    x: 0.10 + ((i * 37) % 100) / 100 * 0.34,
    y: 0.49 + ((i * 53) % 100) / 100 * 0.37,
    phase: i * 0.83,
  }));

  function setActive(name = 'none') {
    document.body.dataset.active = name;
  }

  products.forEach((product) => {
    const name = product.dataset.product || 'none';
    product.addEventListener('pointerenter', () => setActive(name));
    product.addEventListener('focus', () => setActive(name));
    product.addEventListener('pointerleave', () => setActive('none'));
    product.addEventListener('blur', () => setActive('none'));
  });

  function resize() {
    const rect = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now(), true);
  }

  function intensity(name) {
    const active = document.body.dataset.active || 'none';
    if (active === 'none' || active === name) return 1;
    return .34;
  }

  function nodePosition(node, time) {
    const drift = reduceMotion ? 0 : Math.sin(time * .00055 + node.phase) * 5;
    return {
      x: node.x * width,
      y: node.y * height + drift,
    };
  }

  function drawRabbit(time) {
    const alpha = intensity('rabbit');
    ctx.save();
    ctx.globalAlpha = alpha;

    const points = nodes.map((node) => nodePosition(node, time));

    ctx.lineWidth = 1;
    ctx.strokeStyle = palette.line;
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      if (i % 3 === 0 && points[i + 3]) {
        ctx.strokeStyle = palette.faint;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(points[i + 3].x, points[i + 3].y);
        ctx.stroke();
        ctx.strokeStyle = palette.line;
      }
    }

    points.forEach((point, i) => {
      ctx.beginPath();
      ctx.fillStyle = i % 5 === 0 ? palette.point : palette.lineStrong;
      ctx.arc(point.x, point.y, i % 5 === 0 ? 2.4 : 1.4, 0, Math.PI * 2);
      ctx.fill();
    });

    const travel = reduceMotion ? .36 : (time * .00009) % 1;
    const segmentFloat = travel * (points.length - 1);
    const index = Math.floor(segmentFloat);
    const mix = segmentFloat - index;
    const a = points[index];
    const b = points[Math.min(index + 1, points.length - 1)];
    const x = a.x + (b.x - a.x) * mix;
    const y = a.y + (b.y - a.y) * mix;

    ctx.fillStyle = palette.orange;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.orangeSoft;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function waveValue(t, time, focused) {
    const base = Math.sin(t * Math.PI * 4.6) * .17;
    const shoulder = Math.sin(t * Math.PI * 11.4 + .7) * .045;
    const noiseAmount = focused ? .025 : .055;
    const noise = Math.sin(t * 91 + time * .0011) * noiseAmount;
    const peak = Math.exp(-Math.pow((t - .63) / .055, 2)) * .31;
    return base + shoulder + noise - peak;
  }

  function drawQuic(time) {
    const alpha = intensity('quic');
    const focused = document.body.dataset.active === 'quic';
    const left = width * .58;
    const right = width * .93;
    const top = height * .17;
    const bottom = height * .49;
    const center = (top + bottom) / 2;
    const amp = (bottom - top) * .72;

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.strokeStyle = palette.faint;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i += 1) {
      const x = left + (right - left) * (i / 8);
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }
    for (let i = 0; i <= 3; i += 1) {
      const y = top + (bottom - top) * (i / 3);
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    ctx.strokeStyle = palette.lineStrong;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    const samples = 150;
    for (let i = 0; i <= samples; i += 1) {
      const t = i / samples;
      const x = left + (right - left) * t;
      const y = center + waveValue(t, time, focused) * amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const markerT = reduceMotion ? .63 : .58 + Math.sin(time * .0008) * .055;
    const markerX = left + (right - left) * markerT;
    const markerY = center + waveValue(markerT, time, focused) * amp;

    ctx.strokeStyle = palette.orangeSoft;
    ctx.beginPath();
    ctx.moveTo(markerX, top);
    ctx.lineTo(markerX, bottom);
    ctx.stroke();

    ctx.fillStyle = palette.orange;
    ctx.beginPath();
    ctx.arc(markerX, markerY, 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function draw(time, force = false) {
    if (!force && time - last < 32) {
      raf = requestAnimationFrame(draw);
      return;
    }
    last = time;
    ctx.clearRect(0, 0, width, height);
    drawRabbit(time);
    drawQuic(time);
    if (!reduceMotion) raf = requestAnimationFrame(draw);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();
  if (!reduceMotion) raf = requestAnimationFrame(draw);

  window.addEventListener('pagehide', () => {
    observer.disconnect();
    if (raf) cancelAnimationFrame(raf);
  });
})();
