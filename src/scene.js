import * as THREE from 'three';

// A procedural play-house "campus" (cabin, tower with slide, tree, planter, bench, fence).
// Rendered twice over each other: solid MDF-coloured meshes clipped BELOW a rising plane,
// and bright blueprint line-work clipped ABOVE it — so the model literally gets built from
// drawing to object as `state.build` goes 0 → 1.

const BLUEPRINT = 0x7fd0ff;

export function createScene(canvas) {
  const isCoarse = matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isCoarse ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // ---- clipping planes: shared by every material, mutated each frame ----
  const planeSolid = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0); // keeps y <= h
  const planeLines = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // keeps y >= h

  const solidMats = new Map();
  const solidMat = (color, opts = {}) => {
    const key = color + JSON.stringify(opts);
    if (!solidMats.has(key)) {
      solidMats.set(
        key,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.78,
          metalness: 0.02,
          flatShading: !!opts.flat,
          side: THREE.DoubleSide,
          clippingPlanes: [planeSolid],
          emissive: opts.emissive ?? 0x000000,
          emissiveIntensity: opts.emissiveIntensity ?? 0,
        }),
      );
    }
    return solidMats.get(key);
  };

  const lineBright = new THREE.LineBasicMaterial({
    color: BLUEPRINT,
    transparent: true,
    opacity: 0.95,
    clippingPlanes: [planeLines],
  });
  const lineFaint = new THREE.LineBasicMaterial({
    color: BLUEPRINT,
    transparent: true,
    opacity: 0.16,
  });

  const house = new THREE.Group();
  scene.add(house);

  // add a mesh together with its blueprint edges
  function add(geo, color, pos = [0, 0, 0], rot = [0, 0, 0], opts = {}) {
    const mesh = new THREE.Mesh(geo, solidMat(color, opts));
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.castShadow = !opts.noShadow;
    mesh.receiveShadow = true;
    if (!opts.noEdges) {
      const edges = new THREE.EdgesGeometry(geo, 28);
      mesh.add(new THREE.LineSegments(edges, lineFaint));
      mesh.add(new THREE.LineSegments(edges, lineBright));
    }
    house.add(mesh);
    return mesh;
  }
  const box = (w, h, d, color, pos, rot, opts) => add(new THREE.BoxGeometry(w, h, d), color, pos, rot, opts);

  const C = {
    birch: 0xf3e4c4,
    cream: 0xefe0c0,
    wood: 0xc98a4b,
    walnut: 0x8a5a33,
    coral: 0xe8553d,
    teal: 0x2bb3a0,
    sky: 0x5aa9ff,
    amber: 0xf2a93b,
    pink: 0xff8fb1,
    green: 0x3fa86b,
    green2: 0x62c987,
    stone: 0xd9c3a0,
    dark: 0x2a2420,
  };

  // ground slab (turf + birch base)
  box(7.2, 0.14, 5.2, C.birch, [0, -0.07, 0], [0, 0, 0], { noShadow: true });
  box(6.9, 0.04, 4.9, 0x4f9b5b, [0, 0.02, 0], [0, 0, 0], { noShadow: true, noEdges: true });

  // ---- cabin (job hut) ----
  const cx = -1.7;
  box(2.3, 1.45, 1.8, C.cream, [cx, 0.745, 0.2]);
  // roof: triangular prism
  {
    const s = new THREE.Shape();
    s.moveTo(-1.35, 0);
    s.lineTo(1.35, 0);
    s.lineTo(0, 0.95);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 2.2, bevelEnabled: false });
    g.translate(0, 0, -1.1);
    add(g, C.coral, [cx, 1.47, 0.2]);
  }
  box(0.28, 0.65, 0.28, C.walnut, [cx + 0.7, 2.1, -0.1]); // chimney
  box(0.52, 0.95, 0.06, C.teal, [cx - 0.55, 0.52, 1.12]); // door
  box(0.06, 0.06, 0.06, C.amber, [cx - 0.38, 0.5, 1.16], [0, 0, 0], { noEdges: true }); // knob
  box(0.7, 0.5, 0.06, C.sky, [cx + 0.55, 0.85, 1.12]); // window
  box(0.8, 0.07, 0.12, C.walnut, [cx + 0.55, 0.55, 1.18]); // sill
  // flower box under the window
  box(0.78, 0.16, 0.16, C.wood, [cx + 0.55, 0.45, 1.22]);
  for (let i = 0; i < 4; i++) {
    add(new THREE.IcosahedronGeometry(0.09, 0), i % 2 ? C.pink : C.green2, [cx + 0.27 + i * 0.19, 0.58, 1.22], [0, 0, 0], {
      flat: true,
      noEdges: true,
    });
  }
  // striped counter awning
  for (let i = 0; i < 6; i++) {
    box(0.17, 0.05, 0.5, i % 2 ? C.cream : C.coral, [cx + 0.15 + i * 0.17, 1.12, 1.35], [0.28, 0, 0], {
      noEdges: true,
    });
  }

  // ---- castle tower + slide + stairs ----
  const tx = 1.55;
  box(1.2, 2.0, 1.2, C.stone, [tx, 1.0, -0.7]);
  box(0.46, 0.7, 0.06, C.dark, [tx, 0.48, -0.08]); // arched door (flat)
  box(0.32, 0.42, 0.06, C.sky, [tx + 0.3, 1.45, -0.08]); // window
  box(0.32, 0.42, 0.06, C.sky, [tx - 0.3, 1.45, -0.08]);
  const cren = [
    [-0.5, -0.5], [0, -0.5], [0.5, -0.5],
    [-0.5, 0.5], [0, 0.5], [0.5, 0.5],
    [-0.5, 0], [0.5, 0],
  ];
  cren.forEach(([dx, dz]) => box(0.24, 0.28, 0.24, C.stone, [tx + dx, 2.14, -0.7 + dz]));
  // flag
  box(0.04, 0.9, 0.04, C.walnut, [tx, 2.7, -0.7], [0, 0, 0], { noEdges: true });
  box(0.5, 0.28, 0.02, C.coral, [tx + 0.27, 3.0, -0.7]);
  // slide
  const ang = Math.atan2(1.25, 2.0);
  box(0.62, 0.07, 2.4, C.amber, [tx, 0.7, 0.85], [ang, 0, 0]);
  box(0.07, 0.2, 2.4, C.coral, [tx - 0.34, 0.78, 0.85], [ang, 0, 0], { noEdges: true });
  box(0.07, 0.2, 2.4, C.coral, [tx + 0.34, 0.78, 0.85], [ang, 0, 0], { noEdges: true });
  // stairs up to the tower (left side)
  for (let i = 0; i < 4; i++) {
    const h = 1.15 - i * 0.28;
    box(0.3, h, 0.8, i % 2 ? C.birch : C.pink, [tx - 0.75 - i * 0.3, h / 2, -0.5]);
  }

  // ---- low-poly tree ----
  const treeX = -0.15;
  const treeZ = -1.55;
  add(new THREE.CylinderGeometry(0.15, 0.22, 1.5, 7), C.walnut, [treeX, 0.75, treeZ], [0, 0, 0], { noEdges: true });
  [
    [0, 1.75, 0, 0.7, C.green],
    [-0.35, 1.5, 0.15, 0.5, C.green2],
    [0.35, 1.55, -0.1, 0.52, C.green2],
    [0, 2.25, 0, 0.45, C.green],
  ].forEach(([x, y, z, r, c]) =>
    add(new THREE.IcosahedronGeometry(r, 0), c, [treeX + x, y, treeZ + z], [0, 0, 0], { flat: true, noEdges: true }),
  );

  // ---- bench + planter ----
  box(1.2, 0.07, 0.4, C.wood, [-0.15, 0.4, 1.95]);
  box(1.2, 0.34, 0.06, C.wood, [-0.15, 0.62, 2.12]);
  [-0.65, 0.35].forEach((dx) => box(0.07, 0.4, 0.36, C.walnut, [dx, 0.2, 1.95], [0, 0, 0], { noEdges: true }));
  box(1.4, 0.32, 0.42, C.wood, [-2.4, 0.16, 1.9]);
  for (let i = 0; i < 6; i++) {
    add(new THREE.IcosahedronGeometry(0.13, 0), i % 3 === 0 ? C.pink : C.green2, [-2.95 + i * 0.22 + 0.2, 0.42, 1.9], [0, 0, 0], {
      flat: true,
      noEdges: true,
    });
  }

  // ---- slatted fence (left side) ----
  for (let i = 0; i < 9; i++) {
    box(0.09, 0.8, 0.05, i % 2 ? C.birch : C.wood, [-3.3, 0.4, -2.0 + i * 0.5], [0, Math.PI / 2, 0], { noEdges: true });
  }

  // ---- warm string lights along the roof eave ----
  const bulbs = [];
  for (let i = 0; i < 8; i++) {
    const m = add(
      new THREE.SphereGeometry(0.045, 10, 10),
      0xffd27a,
      [cx - 1.0 + i * 0.29, 1.5 + Math.sin(i * 1.4) * 0.03, 1.12],
      [0, 0, 0],
      { emissive: 0xffb340, emissiveIntensity: 1.6, noEdges: true, noShadow: true },
    );
    bulbs.push(m);
  }

  // ---- ground grid + scan plane (non-model overlays) ----
  const grid = new THREE.GridHelper(14, 28, BLUEPRINT, BLUEPRINT);
  grid.material.transparent = true;
  grid.material.opacity = 0.1;
  grid.position.y = -0.14;
  scene.add(grid);

  const scanGeo = new THREE.PlaneGeometry(7.6, 5.6);
  const scan = new THREE.Mesh(
    scanGeo,
    new THREE.MeshBasicMaterial({ color: BLUEPRINT, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }),
  );
  scan.rotation.x = -Math.PI / 2;
  house.add(scan);
  const scanEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(scanGeo),
    new THREE.LineBasicMaterial({ color: BLUEPRINT, transparent: true, opacity: 0.9 }),
  );
  scanEdge.rotation.x = -Math.PI / 2;
  house.add(scanEdge);

  // ---- lights ----
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x24303a, 1.05));
  const sun = new THREE.DirectionalLight(0xffe2b8, 2.6);
  sun.position.set(5, 8, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isCoarse ? 1024 : 2048, isCoarse ? 1024 : 2048);
  sun.shadow.camera.left = -6;
  sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 6;
  sun.shadow.camera.bottom = -6;
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x7fd0ff, 0.9);
  rim.position.set(-6, 3, -5);
  scene.add(rim);
  const warm = new THREE.PointLight(0xffb340, 0, 6, 1.6);
  warm.position.set(cx, 1.4, 1.8);
  scene.add(warm);

  // ---- state driven by main.js ----
  const state = {
    build: 0, // 0 = pure blueprint, 1 = fully built
    orbit: 0.35, // radians around Y
    zoom: 1,
    sx: 0, // screen-space shift of the model as a fraction of the viewport (+ = right)
    sy: 0, // (+ = down)
    mouseX: 0,
    mouseY: 0,
  };

  const BUILD_TOP = 3.4;
  let t0 = performance.now();
  let running = false;
  let raf = 0;
  let curMX = 0;
  let curMY = 0;
  let curOrbit = state.orbit;
  let curZoom = 1;
  let curSX = 0;
  let curSY = 0;

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = (now - t0) / 1000;
    const k = 0.075; // smoothing
    curMX += (state.mouseX - curMX) * k;
    curMY += (state.mouseY - curMY) * k;
    curOrbit += (state.orbit - curOrbit) * k;
    curZoom += (state.zoom - curZoom) * k;
    curSX += (state.sx - curSX) * k;
    curSY += (state.sy - curSY) * k;

    house.position.y = Math.sin(t * 0.8) * 0.015;

    // build height (clip planes live in world space, so add the house's own y offset)
    const y = -0.3 + state.build * (BUILD_TOP + 0.3);
    planeSolid.constant = y + house.position.y;
    planeLines.constant = -(y + house.position.y);
    const scanning = state.build > 0.002 && state.build < 0.998;
    scan.visible = scanEdge.visible = scanning;
    scan.position.y = scanEdge.position.y = y;
    grid.material.opacity = 0.1 * (1 - state.build * 0.7);

    // lights fade in at the very end
    const glow = THREE.MathUtils.smoothstep(state.build, 0.86, 1);
    bulbs.forEach((b, i) => {
      b.material.emissiveIntensity = glow * (1.4 + Math.sin(t * 2 + i) * 0.25);
    });
    warm.intensity = glow * 2.2;

    // camera orbit
    const aspect = camera.aspect;
    const baseDist = (aspect < 0.8 ? 34 : aspect < 1.2 ? 21 : 17) / curZoom;
    const a = curOrbit + curMX * 0.28;
    const elev = 0.5 + curMY * 0.1 + (aspect < 0.8 ? 0.05 : 0);
    camera.position.set(Math.sin(a) * baseDist * Math.cos(elev), baseDist * Math.sin(elev) + 0.8, Math.cos(a) * baseDist * Math.cos(elev));
    camera.lookAt(0, 1.05, 0);
    const vw = renderer.domElement.width;
    const vh = renderer.domElement.height;
    camera.setViewOffset(vw, vh, -curSX * vw, -curSY * vh, vw, vh);

    renderer.render(scene, camera);
  }

  function start() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  resize();
  window.addEventListener('resize', resize);

  return { state, start, stop, resize, renderer, isRunning: () => running };
}
