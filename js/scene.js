import * as THREE from 'three';

/* Background scene: floating 3D logo (stacked layers for depth), wireframe core, rings and particles.
   Reacts to mouse and to scroll; colour and position change per section. */
export function initScene(canvas, state, { mobile, reduced }) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070d, 0.035);
  const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  cam.position.set(0, 0, 9);

  const accent = new THREE.Color('#2de38a');
  const group = new THREE.Group(); scene.add(group);

  // wireframe core
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1),
    new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.28 }));
  group.add(core);
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0),
    new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.5 }));
  group.add(inner);

  // rings
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(3 + i * 0.7, 0.012, 8, 160),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.35 - i * 0.08 }));
    r.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    rings.push(r); group.add(r);
  }

  // logo layers (pseudo-extruded 3D logo)
  const logoGroup = new THREE.Group(); group.add(logoGroup);
  new THREE.TextureLoader().load('assets/logo-w3d.png', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const aspect = tex.image.width / tex.image.height, h = 1.9, layers = mobile ? 6 : 12;
    for (let i = 0; i < layers; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(h * aspect, h),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false,
          color: i === layers - 1 ? 0xffffff : accent.clone().multiplyScalar(0.55), opacity: i === layers - 1 ? 1 : 0.5 }));
      m.position.z = (i - layers + 1) * 0.045;
      logoGroup.add(m);
    }
  });

  // floating shapes
  const shapes = [];
  const geos = [new THREE.OctahedronGeometry(0.28), new THREE.TetrahedronGeometry(0.3), new THREE.BoxGeometry(0.34, 0.34, 0.34)];
  for (let i = 0; i < (mobile ? 6 : 14); i++) {
    const m = new THREE.Mesh(geos[i % 3], new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.55 }));
    const a = Math.random() * Math.PI * 2, d = 4 + Math.random() * 4;
    m.position.set(Math.cos(a) * d, (Math.random() - 0.5) * 7, Math.sin(a) * d - 2);
    m.userData = { s: 0.2 + Math.random() * 0.5, o: Math.random() * 6 };
    shapes.push(m); scene.add(m);
  }

  // stars: soft round points, a gentle twinkle on some of them, and a glow control (see "stars" in js/config.js)
  const SC = Object.assign({ glow: 0.4, twinkle: 0.4, meteors: true, meteorEvery: 10 }, (typeof window !== 'undefined' && window.WEBVERSE && window.WEBVERSE.stars) || {});
  const clamp01 = v => Math.min(1, Math.max(0, Number(v) || 0));
  const N = mobile ? 900 : 2000, pos = new Float32Array(N * 3), aSize = new Float32Array(N), aPhase = new Float32Array(N), aTw = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 40; pos[i * 3 + 1] = (Math.random() - 0.5) * 40; pos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
    aSize[i] = Math.random() < 0.06 ? 1.9 + Math.random() * 0.8 : 0.7 + Math.random() * 0.8;   // a few brighter "hero" stars
    aPhase[i] = Math.random() * 6.2831; aTw[i] = Math.random() < 0.4 ? 1 : 0;                  // ~40% of stars twinkle
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  pg.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1)); pg.setAttribute('aTw', new THREE.BufferAttribute(aTw, 1));
  const starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: accent }, uTime: { value: 0 }, uGlow: { value: clamp01(SC.glow) }, uTw: { value: reduced ? 0 : clamp01(SC.twinkle) }, uPx: { value: renderer.getPixelRatio() }, uScale: { value: 450 } },
    vertexShader: `attribute float aSize; attribute float aPhase; attribute float aTw;
      uniform float uTime, uGlow, uTw, uPx, uScale; varying float vA; varying float vFog;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float tw = aTw > 0.5 ? 0.5 + 0.5 * sin(uTime * (0.7 + aPhase * 0.22) + aPhase) : 1.0;
        vA = mix(1.0, tw, uTw);
        float d = -mv.z; vFog = 1.0 - exp(-0.035 * 0.035 * d * d);
        gl_PointSize = max(2.3 * uPx, 0.05 * aSize * (1.0 + uGlow * 1.3) * uPx * (uScale / d));   // never smaller than ~2px, so soft round stars stay visible
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uGlow; varying float vA; varying float vFog;
      void main(){
        float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard;
        float halo = pow(1.0 - d, mix(3.2, 1.7, uGlow));
        float core = smoothstep(0.35, 0.0, d);
        float a = (halo * (0.6 + 0.6 * uGlow) + core * 0.9) * vA * (1.0 - vFog) * 0.95;
        gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.35), a); }`
  });
  const points = new THREE.Points(pg, starMat); points.frustumCulled = false;
  scene.add(points);

  // meteors: thin glowing streaks that cross the sky now and then
  const mc = document.createElement('canvas'); mc.width = 256; mc.height = 16; const mx = mc.getContext('2d');
  const mg = mx.createLinearGradient(0, 0, 256, 0); mg.addColorStop(0, 'rgba(255,255,255,0)'); mg.addColorStop(0.75, 'rgba(255,255,255,.55)'); mg.addColorStop(1, 'rgba(255,255,255,1)');
  mx.fillStyle = mg; mx.beginPath(); mx.moveTo(0, 8); mx.lineTo(256, 2); mx.lineTo(256, 14); mx.closePath(); mx.fill();
  const meteorTex = new THREE.CanvasTexture(mc);
  const meteors = []; const meteorOn = !!SC.meteors && !reduced;
  for (let i = 0; i < 4 && meteorOn; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.05), new THREE.MeshBasicMaterial({ map: meteorTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false }));
    m.visible = false; m.userData = { life: 0, dur: 1, vx: 0, vy: 0 }; scene.add(m); meteors.push(m);
  }
  let nextMeteor = 3, meteorCount = 0, queued = 0, queueAt = 0;
  function launchMeteor() {
    const m = meteors.find(x => !x.visible); if (!m) return;
    const z = -4, halfH = Math.tan(25 * Math.PI / 180) * (cam.position.z - z), halfW = halfH * cam.aspect;
    const ang = (200 + Math.random() * 25) * Math.PI / 180, spd = 13 + Math.random() * 7, len = 2.2 + Math.random() * 1.8;   // heading down-left
    const u = m.userData; u.vx = Math.cos(ang) * spd; u.vy = Math.sin(ang) * spd; u.dur = 0.9 + Math.random() * 0.5; u.life = 0;
    m.scale.set(len, 1, 1); m.rotation.z = ang;
    m.position.set((Math.random() * 1.3 - 0.35) * halfW + halfW * 0.25, halfH * (0.35 + Math.random() * 0.75), z);
    m.visible = true;
  }
  function updateMeteors(t, dtSec) {
    if (!meteorOn) return;
    if (t > nextMeteor) {
      meteorCount++; const shower = meteorCount % 5 === 0;                         // every 5th event is a short mini-shower
      queued = shower ? 3 : (Math.random() < 0.35 ? 1 : 0); queueAt = t + 0.18; launchMeteor();
      nextMeteor = t + Math.max(3, SC.meteorEvery) * (0.7 + Math.random() * 0.6);
    }
    if (queued > 0 && t > queueAt) { launchMeteor(); queued--; queueAt = t + 0.15 + Math.random() * 0.25; }
    meteors.forEach(m => {
      if (!m.visible) return; const u = m.userData; u.life += dtSec / u.dur;
      if (u.life >= 1) { m.visible = false; m.material.opacity = 0; return; }
      m.position.x += u.vx * dtSec; m.position.y += u.vy * dtSec;
      m.material.opacity = Math.sin(u.life * Math.PI) * 0.9;
    });
  }

  const colorTargets = [core.material, inner.material, ...rings.map(r => r.material), ...shapes.map(s => s.material)];
  const target = new THREE.Color('#2de38a');

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    starMat.uniforms.uScale.value = h * 0.5;
  }
  resize(); addEventListener('resize', resize);

  const cur = { x: 4.4, s: 1, scroll: 0, mx: 0, my: 0, vel: 0 };
  const clock = new THREE.Clock();
  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) loop(); });

  let last = performance.now();
  function frame() {
    const t = clock.getElapsedTime();
    const now = performance.now(), dt = Math.min((now - last) / 16.67, 6); last = now;
    const L = f => 1 - Math.pow(1 - f, dt);
    const k = reduced ? 0.02 : 0.06;
    target.set(state.hue);
    accent.lerp(target, L(0.04));
    colorTargets.forEach(m => m.color.copy(accent));
    logoGroup.children.forEach((m, i, a) => { if (i < a.length - 1) m.material.color.copy(accent).multiplyScalar(0.55); });

    cur.scroll += (state.scroll - cur.scroll) * L(0.07);
    cur.mx += (state.mx - cur.mx) * L(0.06); cur.my += (state.my - cur.my) * L(0.06);
    const tx = mobile ? 0 : state.x * (innerWidth / 1366 > 0.8 ? 1 : 0.7);
    cur.s += (state.s - cur.s) * L(0.05);
    cur.x += (tx - cur.x) * L(0.045);

    group.position.x = cur.x;
    group.position.y = mobile ? -2.6 : Math.sin(cur.scroll * 18) * 0.25;
    const sc = (mobile ? 0.62 : 1) * (0.55 + cur.s * 0.45 * (mobile ? 0.7 : 1)); group.scale.setScalar(sc);
    const dim = (0.3 + cur.s * 0.7) * (mobile ? 0.55 : 1); core.material.opacity = 0.28 * dim; inner.material.opacity = 0.5 * dim;
    logoGroup.children.forEach((m, i, a) => { m.material.opacity = (i === a.length - 1 ? 1 : 0.5) * dim; });
    group.rotation.y = t * 0.12 + cur.scroll * 14 + cur.mx * 0.5;
    group.rotation.x = cur.my * 0.35 + Math.sin(t * 0.3) * 0.08;
    core.rotation.z = t * 0.1; inner.rotation.x = -t * 0.35; inner.rotation.y = t * 0.25;
    rings.forEach((r, i) => { r.rotation.x += 0.002 * (i + 1); r.rotation.y += 0.003 * (3 - i); });
    // logo always faces viewer, tilts toward the pointer
    logoGroup.rotation.y = -group.rotation.y + cur.mx * 0.5;
    logoGroup.rotation.x = -group.rotation.x + cur.my * 0.3;
    logoGroup.position.y = Math.sin(t * 0.8) * 0.12;

    shapes.forEach(s => { const u = s.userData; s.rotation.x = t * u.s + u.o; s.rotation.y = t * u.s * 0.8; s.position.y += Math.sin(t * u.s + u.o) * 0.002; });
    starMat.uniforms.uTime.value = t; updateMeteors(t, Math.min(dt * 0.01667, 0.1));
    points.rotation.y = t * 0.012 + cur.scroll * 3;
    points.position.y = cur.scroll * 12;
    cam.position.x += (cur.mx * 0.6 - cam.position.x) * 0.04;
    cam.position.y += (-cur.my * 0.4 - cam.position.y) * 0.04;
    cam.position.z = 9 - Math.sin(cur.scroll * Math.PI) * 1.2;
    cam.lookAt(0, 0, 0);
    renderer.render(scene, cam);
  }
  function loop() { if (!running) return; frame(); requestAnimationFrame(loop); }
  if (reduced) frame(); else loop();
  return { renderer };
}

/* Tiny 3D cursor: a spinning crystal that stretches with pointer velocity. */
export function initCursor3D(canvas, getVel, getHue) {
  let r;
  try { r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); } catch (e) { return false; }
  r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.setSize(canvas.width, canvas.height, false);
  const s = new THREE.Scene(), c = new THREE.PerspectiveCamera(40, 1, 0.1, 20); c.position.z = 4;
  const col = new THREE.Color('#2de38a');
  const solid = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35 }));
  const wire = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
  const g = new THREE.Group(); g.add(solid, wire); s.add(g);
  let vx = 0, vy = 0;
  (function loop() {
    const v = getVel(); vx += (v.x - vx) * 0.2; vy += (v.y - vy) * 0.2;
    g.rotation.y += 0.02 + Math.abs(vx) * 0.02; g.rotation.x += 0.012 + Math.abs(vy) * 0.02;
    const sp = Math.min(Math.hypot(vx, vy) / 40, 0.6);
    g.scale.set(1 + sp, 1 - sp * 0.3, 1);
    col.lerp(new THREE.Color(getHue()), 0.06); solid.material.color.copy(col);
    r.render(s, c); requestAnimationFrame(loop);
  })();
  return true;
}
