import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

type PieceKind = "box" | "beam" | "cube" | "cylinder" | "capsule";

type PieceSpec = {
  kind: PieceKind;
  size: [number, number, number];
  color: number;
  radius?: number;
  halfHeight?: number;
};

type TowerPiece = {
  mesh: THREE.Mesh;
  body: RAPIER.RigidBody;
  halfExtentY: number;
  landed: boolean;
  droppedAt: number;
  landingHeight: number;
};

export type TowerEngineApi = {
  move: (x: number, z: number) => void;
  rotate: (direction?: number) => void;
  drop: () => void;
  restart: () => void;
  setPaused: (paused: boolean) => void;
  destroy: () => void;
};

export type TowerEngineOptions = {
  mount: HTMLElement;
  reducedMotion: boolean;
  onHeight: (height: number) => void;
  onPiece: (label: string) => void;
  onCollapse: (height: number) => void;
  onReady: () => void;
};

const PIECES: PieceSpec[] = [
  { kind: "box", size: [1.75, 0.58, 1.18], color: 0x90b9d8 },
  { kind: "beam", size: [2.5, 0.44, 0.7], color: 0xc5d5e4 },
  { kind: "cube", size: [1.06, 1.06, 1.06], color: 0x6f91b2 },
  { kind: "cylinder", size: [1.38, 0.68, 1.38], radius: 0.69, halfHeight: 0.34, color: 0x9c88ad },
  { kind: "capsule", size: [0.86, 1.75, 0.86], radius: 0.43, halfHeight: 0.445, color: 0x78a6a2 }
];

const labelFor = (kind: PieceKind) =>
  ({
    box: "SLAB",
    beam: "BEAM",
    cube: "BLOCK",
    cylinder: "DRUM",
    capsule: "CAPSULE"
  })[kind];

function geometryFor(spec: PieceSpec) {
  if (spec.kind === "cylinder") {
    return new THREE.CylinderGeometry(spec.radius, spec.radius, spec.size[1], 24);
  }
  if (spec.kind === "capsule") {
    return new THREE.CapsuleGeometry(spec.radius, spec.halfHeight! * 2, 8, 16);
  }
  return new THREE.BoxGeometry(...spec.size);
}

function colliderFor(spec: PieceSpec) {
  if (spec.kind === "cylinder") {
    return RAPIER.ColliderDesc.cylinder(spec.halfHeight!, spec.radius!);
  }
  if (spec.kind === "capsule") {
    return RAPIER.ColliderDesc.capsule(spec.halfHeight!, spec.radius!);
  }
  return RAPIER.ColliderDesc.cuboid(spec.size[0] / 2, spec.size[1] / 2, spec.size[2] / 2);
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Points)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

export async function createTowerEngine({
  mount,
  reducedMotion,
  onHeight,
  onPiece,
  onCollapse,
  onReady
}: TowerEngineOptions): Promise<TowerEngineApi> {
  await RAPIER.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03060c);
  scene.fog = new THREE.FogExp2(0x07101c, 0.035);

  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 90);
  camera.position.set(8.2, 6.5, 10.5);

  const renderer = new THREE.WebGLRenderer({
    antialias: !reducedMotion,
    alpha: false,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, reducedMotion ? 1 : 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.domElement.className = "tower-game-canvas";
  renderer.domElement.setAttribute(
    "aria-label",
    "3D tower arena. Drag to position the next piece, then use rotate and drop controls."
  );
  renderer.domElement.setAttribute("role", "img");
  mount.appendChild(renderer.domElement);

  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.integrationParameters.dt = 1 / 60;
  world.integrationParameters.numSolverIterations = 5;

  const ambient = new THREE.HemisphereLight(0xbedcff, 0x07101c, 1.75);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xe3efff, 4.25);
  key.position.set(5, 11, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(reducedMotion ? 512 : 1024, reducedMotion ? 512 : 1024);
  key.shadow.camera.left = -9;
  key.shadow.camera.right = 9;
  key.shadow.camera.top = 15;
  key.shadow.camera.bottom = -3;
  scene.add(key);

  const rim = new THREE.PointLight(0x5879b4, 35, 18, 2);
  rim.position.set(-5, 5, -4);
  scene.add(rim);

  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a1321,
    roughness: 0.82,
    metalness: 0.22
  });
  const ground = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.05, 0.55, 48), groundMaterial);
  ground.position.y = -0.3;
  ground.receiveShadow = true;
  scene.add(ground);

  const baseBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.3, 0));
  world.createCollider(RAPIER.ColliderDesc.cylinder(0.275, 4.5).setFriction(0.82), baseBody);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x6284ac,
    transparent: true,
    opacity: 0.19,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const rings = [2.4, 3.35, 4.35].map((radius, index) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius, radius + 0.018, 64), ringMaterial.clone());
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005 + index * 0.002;
    scene.add(ring);
    return ring;
  });

  const starGeometry = new THREE.BufferGeometry();
  const starCount = reducedMotion ? 50 : 110;
  const starPositions = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 7 + Math.random() * 15;
    starPositions[index * 3] = Math.cos(angle) * radius;
    starPositions[index * 3 + 1] = 1 + Math.random() * 18;
    starPositions[index * 3 + 2] = Math.sin(angle) * radius;
  }
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0x8eacca,
      size: 0.035,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    })
  );
  scene.add(stars);

  const pieces: TowerPiece[] = [];
  let preview: { mesh: THREE.Mesh; spec: PieceSpec; x: number; z: number; yaw: number } | null = null;
  let previewIndex = -1;
  let highest = 0;
  let currentTop = 0;
  let pieceCount = 0;
  let paused = false;
  let destroyed = false;
  let collapsed = false;
  let raf = 0;
  let lastTime = performance.now();
  let accumulator = 0;
  let nextPieceTimer = 0;
  let scoreUpdateTimer = 0;
  let shakeUntil = 0;
  let collapseTimer = 0;
  let burst: THREE.Points | null = null;
  let burstVelocity: Float32Array | null = null;
  let dragPointer: number | null = null;
  let dragX = 0;
  let dragY = 0;

  const clampPosition = (value: number) => Math.max(-3.25, Math.min(3.25, value));

  const makeMaterial = (color: number, ghost = false) =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.44,
      metalness: 0.18,
      clearcoat: 0.35,
      clearcoatRoughness: 0.5,
      transparent: ghost,
      opacity: ghost ? 0.76 : 1,
      emissive: new THREE.Color(color).multiplyScalar(ghost ? 0.11 : 0.025),
      emissiveIntensity: ghost ? 0.8 : 0.35
    });

  const spawnPreview = () => {
    if (destroyed || collapsed || preview) return;
    let nextIndex = Math.floor(Math.random() * PIECES.length);
    if (nextIndex === previewIndex && PIECES.length > 1) nextIndex = (nextIndex + 1) % PIECES.length;
    previewIndex = nextIndex;
    const spec = PIECES[nextIndex];
    const mesh = new THREE.Mesh(geometryFor(spec), makeMaterial(spec.color, true));
    mesh.castShadow = !reducedMotion;
    mesh.receiveShadow = true;
    const halfY = spec.size[1] / 2;
    mesh.position.set(0, Math.max(currentTop + 3.25, 3.5) + halfY, 0);
    scene.add(mesh);
    preview = { mesh, spec, x: 0, z: 0, yaw: Math.random() > 0.58 ? Math.PI / 2 : 0 };
    preview.mesh.rotation.y = preview.yaw;
    onPiece(labelFor(spec.kind));
  };

  const move = (x: number, z: number) => {
    if (!preview || collapsed || paused) return;
    preview.x = clampPosition(preview.x + x);
    preview.z = clampPosition(preview.z + z);
    preview.mesh.position.x = preview.x;
    preview.mesh.position.z = preview.z;
  };

  const rotate = (direction = 1) => {
    if (!preview || collapsed || paused) return;
    preview.yaw += direction * (Math.PI / 8);
    preview.mesh.rotation.y = preview.yaw;
  };

  const drop = () => {
    if (!preview || collapsed || paused) return;
    const { mesh: ghost, spec, x, z, yaw } = preview;
    const position = ghost.position.clone();
    scene.remove(ghost);
    disposeObject(ghost);
    preview = null;

    const mesh = new THREE.Mesh(geometryFor(spec), makeMaterial(spec.color));
    mesh.position.copy(position);
    mesh.rotation.y = yaw;
    mesh.castShadow = !reducedMotion;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(x, position.y, z)
        .setRotation({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) })
        .setLinearDamping(0.18)
        .setAngularDamping(0.34)
        .setCanSleep(true)
        .setCcdEnabled(true)
    );
    const collider = colliderFor(spec)
      .setDensity(0.8 + Math.min(pieceCount, 12) * 0.025)
      .setFriction(Math.max(0.58, 0.82 - pieceCount * 0.007))
      .setRestitution(0.025);
    world.createCollider(collider, body);

    pieces.push({
      mesh,
      body,
      halfExtentY: spec.size[1] / 2,
      landed: false,
      droppedAt: performance.now(),
      landingHeight: currentTop
    });
    pieceCount += 1;
    nextPieceTimer = reducedMotion ? 280 : 620;
  };

  const clearPieces = () => {
    if (preview) {
      scene.remove(preview.mesh);
      disposeObject(preview.mesh);
      preview = null;
    }
    pieces.splice(0).forEach(({ mesh, body }) => {
      scene.remove(mesh);
      disposeObject(mesh);
      if (world.bodies.contains(body.handle)) world.removeRigidBody(body);
    });
    if (burst) {
      scene.remove(burst);
      disposeObject(burst);
      burst = null;
      burstVelocity = null;
    }
  };

  const restart = () => {
    clearPieces();
    highest = 0;
    currentTop = 0;
    pieceCount = 0;
    collapsed = false;
    nextPieceTimer = 0;
    shakeUntil = 0;
    onHeight(0);
    spawnPreview();
  };

  const startCollapseBurst = () => {
    if (collapsed) return;
    collapsed = true;
    if (preview) {
      scene.remove(preview.mesh);
      disposeObject(preview.mesh);
      preview = null;
    }

    const count = reducedMotion ? 16 : 75;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    burstVelocity = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 1.6;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = Math.max(0.25, Math.min(currentTop, 2.2)) * Math.random();
      positions[index * 3 + 2] = Math.sin(angle) * radius;
      burstVelocity[index * 3] = Math.cos(angle) * (0.9 + Math.random() * 2.4);
      burstVelocity[index * 3 + 1] = 0.6 + Math.random() * 2.5;
      burstVelocity[index * 3 + 2] = Math.sin(angle) * (0.9 + Math.random() * 2.4);
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    burst = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0x9abbd1,
        size: reducedMotion ? 0.16 : 0.23,
        transparent: true,
        opacity: reducedMotion ? 0.35 : 0.72,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    scene.add(burst);

    if (!reducedMotion) {
      pieces.forEach(({ body }, index) => {
        const angle = index * 2.17;
        body.applyImpulse(
          { x: Math.cos(angle) * 0.34, y: 0.18 + Math.random() * 0.24, z: Math.sin(angle) * 0.34 },
          true
        );
      });
      shakeUntil = performance.now() + 720;
    }
    collapseTimer = reducedMotion ? 420 : 1350;
    onCollapse(highest);
  };

  const updateBurst = (delta: number) => {
    if (!burst || !burstVelocity) return;
    const attribute = burst.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let index = 0; index < attribute.count; index += 1) {
      const offset = index * 3;
      attribute.array[offset] += burstVelocity[offset] * delta;
      attribute.array[offset + 1] += burstVelocity[offset + 1] * delta;
      attribute.array[offset + 2] += burstVelocity[offset + 2] * delta;
      burstVelocity[offset] *= 0.985;
      burstVelocity[offset + 1] = burstVelocity[offset + 1] * 0.985 - 1.7 * delta;
      burstVelocity[offset + 2] *= 0.985;
    }
    attribute.needsUpdate = true;
    const material = burst.material as THREE.PointsMaterial;
    material.opacity = Math.max(0, material.opacity - delta * (reducedMotion ? 0.85 : 0.42));
  };

  const syncPhysics = (now: number) => {
    currentTop = 0;
    let hasEscaped = false;
    pieces.forEach((piece) => {
      const translation = piece.body.translation();
      const rotation = piece.body.rotation();
      piece.mesh.position.set(translation.x, translation.y, translation.z);
      piece.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);

      const velocity = piece.body.linvel();
      const oldEnough = now - piece.droppedAt > 280;
      if (
        !piece.landed &&
        oldEnough &&
        (translation.y <= piece.landingHeight + piece.halfExtentY + 0.7 ||
          (Math.abs(velocity.y) < 0.28 && translation.y < piece.landingHeight + 2.2))
      ) {
        piece.landed = true;
      }

      if (piece.landed && translation.y > -0.7) {
        const bounds = new THREE.Box3().setFromObject(piece.mesh);
        currentTop = Math.max(currentTop, bounds.max.y);
      }

      if (
        piece.landed &&
        (translation.y < -1.35 || Math.abs(translation.x) > 5.25 || Math.abs(translation.z) > 5.25)
      ) {
        hasEscaped = true;
      }
    });

    if (currentTop > highest + 0.02) {
      highest = currentTop;
      if (now - scoreUpdateTimer > 75) {
        scoreUpdateTimer = now;
        onHeight(highest);
      }
    }

    if (pieceCount >= 2 && hasEscaped) startCollapseBurst();
  };

  const updateCamera = (now: number, delta: number) => {
    const focusY = Math.max(1.5, Math.min(currentTop * 0.52 + 1.1, 10.5));
    const distance = 10.8 + Math.min(currentTop * 0.15, 2.6);
    const orbit = reducedMotion ? 0.64 : 0.64 + Math.sin(now * 0.00009) * 0.055;
    camera.position.x += (Math.cos(orbit) * distance - camera.position.x) * Math.min(1, delta * 1.8);
    camera.position.z += (Math.sin(orbit) * distance - camera.position.z) * Math.min(1, delta * 1.8);
    camera.position.y += (focusY + 4.15 - camera.position.y) * Math.min(1, delta * 2);

    const shake = now < shakeUntil ? (shakeUntil - now) / 720 : 0;
    if (shake > 0) {
      camera.position.x += (Math.random() - 0.5) * shake * 0.22;
      camera.position.y += (Math.random() - 0.5) * shake * 0.15;
    }
    camera.lookAt(0, focusY, 0);
  };

  const frame = (now: number) => {
    if (destroyed || paused) return;
    const delta = Math.min((now - lastTime) / 1000, 0.04);
    lastTime = now;
    accumulator += delta;

    while (accumulator >= 1 / 60) {
      if (!collapsed || collapseTimer > 0) {
        world.step();
        if (!collapsed && currentTop > 3.5 && pieceCount > 3) {
          const intensity = Math.min((currentTop - 3.5) * 0.00016, 0.00135);
          const swayX = Math.sin(now * 0.0017) * intensity;
          const swayZ = Math.cos(now * 0.00123) * intensity;
          pieces.forEach(({ body, landed }) => {
            if (landed && !body.isSleeping()) {
              body.addForce({ x: swayX, y: 0, z: swayZ }, false);
            }
          });
        }
      }
      accumulator -= 1 / 60;
    }

    if (!collapsed) {
      syncPhysics(now);
      if (!preview && nextPieceTimer > 0) {
        nextPieceTimer -= delta * 1000;
        if (nextPieceTimer <= 0) spawnPreview();
      }
    } else {
      syncPhysics(now);
      updateBurst(delta);
      collapseTimer -= delta * 1000;
      if (collapseTimer <= 0 && collapseTimer > -10_000) {
        clearPieces();
        collapseTimer = -20_000;
      }
    }

    if (preview && !reducedMotion) {
      preview.mesh.position.y += Math.sin(now * 0.003) * 0.0008;
      (preview.mesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity =
        0.75 + Math.sin(now * 0.004) * 0.13;
    }
    rings.forEach((ring, index) => {
      ring.rotation.z = reducedMotion ? 0 : now * 0.000045 * (index % 2 ? -1 : 1);
    });
    updateCamera(now, delta);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const width = Math.max(mount.clientWidth, 1);
    const height = Math.max(mount.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  resize();

  const onPointerDown = (event: PointerEvent) => {
    if (!preview || collapsed || paused) return;
    dragPointer = event.pointerId;
    dragX = event.clientX;
    dragY = event.clientY;
    renderer.domElement.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent) => {
    if (dragPointer !== event.pointerId || !preview || collapsed || paused) return;
    const scale = mount.clientWidth < 600 ? 0.014 : 0.01;
    move((event.clientX - dragX) * scale, (event.clientY - dragY) * scale);
    dragX = event.clientX;
    dragY = event.clientY;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (dragPointer !== event.pointerId) return;
    dragPointer = null;
    if (renderer.domElement.hasPointerCapture(event.pointerId)) {
      renderer.domElement.releasePointerCapture(event.pointerId);
    }
  };
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointercancel", onPointerUp);

  const setPaused = (nextPaused: boolean) => {
    if (paused === nextPaused || destroyed) return;
    paused = nextPaused;
    mount.dataset.simulation = paused ? "paused" : "running";
    if (paused) {
      cancelAnimationFrame(raf);
    } else {
      lastTime = performance.now();
      accumulator = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    renderer.domElement.removeEventListener("pointerdown", onPointerDown);
    renderer.domElement.removeEventListener("pointermove", onPointerMove);
    renderer.domElement.removeEventListener("pointerup", onPointerUp);
    renderer.domElement.removeEventListener("pointercancel", onPointerUp);
    clearPieces();
    disposeObject(ground);
    rings.forEach(disposeObject);
    disposeObject(stars);
    renderer.renderLists.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    world.free();
  };

  spawnPreview();
  onReady();
  mount.dataset.simulation = "running";
  raf = requestAnimationFrame(frame);

  return { move, rotate, drop, restart, setPaused, destroy };
}
