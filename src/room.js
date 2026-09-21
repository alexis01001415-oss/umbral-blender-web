import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const clamp = THREE.MathUtils.clamp;
const smooth = (t) => t * t * (3 - 2 * t);
const LIGHTS = {
  day: {
    sky: "#c9e1e7",
    sun: "#fff3dc",
    sunPower: 3.3,
    ambient: 0.52,
    window: 5.8,
    lamp: 17,
    exterior: 1,
    exposure: 1.05,
    background: "#718581",
  },
  golden: {
    sky: "#cad7cf",
    sun: "#ffe0ae",
    sunPower: 2.65,
    ambient: 0.4,
    window: 4.8,
    lamp: 24,
    exterior: 0.75,
    exposure: 1.02,
    background: "#758279",
  },
  night: {
    sky: "#899fce",
    sun: "#a9c9ff",
    sunPower: 0.18,
    ambient: 0.16,
    window: 0.4,
    lamp: 32,
    exterior: 0.025,
    exposure: 1.08,
    background: "#1e2a3d",
  },
};
const FABRICS = { carbon: "#474844", linen: "#c9bea7", clay: "#977357" };

export async function createRoom(container, events = {}) {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const mobile = () => container.clientWidth < 620;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#65766b");
  const camera = new THREE.PerspectiveCamera(43, 1, 0.08, 150);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, mobile() ? 1.5 : 1.75),
  );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");
  const onContextLost = (event) => {
    event.preventDefault();
    events.onError?.(
      "El navegador pausó los gráficos. Pulsa «Volver a intentar» para recuperar la habitación.",
    );
  };
  renderer.domElement.addEventListener("webglcontextlost", onContextLost);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 10;
  controls.minPolarAngle = Math.PI * 0.34;
  controls.maxPolarAngle = Math.PI * 0.55;
  controls.minAzimuthAngle = -0.32;
  controls.maxAzimuthAngle = 0.52;
  controls.rotateSpeed = 0.35;
  controls.zoomSpeed = 0.65;
  // On phones a vertical swipe scrolls the page; two fingers inspect the scene.
  if (mobile()) {
    controls.touches.ONE = null;
    controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    renderer.domElement.style.touchAction = "pan-y";
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentRoom = new RoomEnvironment();
  const environment = pmrem.fromScene(environmentRoom, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.28;
  environmentRoom.dispose();
  pmrem.dispose();
  RectAreaLightUniformsLib.init();

  const hemi = new THREE.HemisphereLight("#dbe3d1", "#494139", 0.45);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#ffdfb0", 2.6);
  sun.position.set(-3.6, 6.5, -5.2);
  sun.target.position.set(0.7, 0.2, 0.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile() ? 1024 : 2048, mobile() ? 1024 : 2048);
  Object.assign(sun.shadow.camera, {
    left: -5,
    right: 5,
    top: 5,
    bottom: -5,
    near: 0.5,
    far: 22,
  });
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.012;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const windowLight = new THREE.RectAreaLight("#d8e8de", 5, 2.7, 3);
  windowLight.position.set(-0.9, 2.2, -2.35);
  windowLight.lookAt(-0.2, 1.4, 2.5);
  scene.add(windowLight);
  const fill = new THREE.RectAreaLight("#e9e2d1", 1.1, 5, 4);
  fill.position.set(0, 3, 4.2);
  fill.lookAt(0, 1.5, -1);
  scene.add(fill);
  const lamp = new THREE.PointLight("#ffcd87", 24, 9, 2);
  lamp.position.set(2.44, 2.02, -1.35);
  lamp.castShadow = !mobile();
  lamp.shadow.mapSize.set(512, 512);
  lamp.shadow.bias = -0.001;
  lamp.shadow.normalBias = 0.016;
  scene.add(lamp);

  let composer;
  let ao;
  if (!mobile()) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    ao = new SSAOPass(
      scene,
      camera,
      container.clientWidth,
      container.clientHeight,
      16,
    );
    ao.kernelRadius = 0.13;
    ao.minDistance = 0.001;
    ao.maxDistance = 0.11;
    composer.addPass(ao);
    composer.addPass(new OutputPass());
  }

  let model;
  try {
    const loader = new GLTFLoader();
    model = await loader.loadAsync(
      `${import.meta.env.BASE_URL}models/umbral-room.glb`,
      (progress) => {
        events.onProgress?.(
          progress.total
            ? Math.min(99, Math.round((progress.loaded / progress.total) * 100))
            : 50,
        );
      },
    );
  } catch (error) {
    renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
    controls.dispose();
    composer?.passes.forEach((pass) => pass.dispose?.());
    composer?.dispose();
    environment.dispose();
    renderer.dispose();
    throw error;
  }

  const materials = new Set();
  const fabrics = new Set();
  const outdoorMaterials = new Set();
  model.scene.traverse((object) => {
    if (object.isLight) {
      object.visible = false;
      return;
    }
    if (!object.isMesh) return;
    let isExterior =
      /Exterior|Landscape|Mountain|Tree|Terrain|Sky|Horizon/i.test(object.name);
    object.traverseAncestors((ancestor) => {
      if (/GROUP_Exterior/i.test(ancestor.name)) isExterior = true;
    });
    object.castShadow = !isExterior && !/Glass|Bulb|Glow/i.test(object.name);
    object.receiveShadow = !isExterior;
    const list = Array.isArray(object.material)
      ? object.material
      : [object.material];
    list.forEach((material) => {
      materials.add(material);
      if (
        /Fabric|Blind.*Textile|Blackout/i.test(material.name) ||
        /BLIND_Fabric/i.test(object.name)
      )
        fabrics.add(material);
      if (isExterior) outdoorMaterials.add(material);
      if (material.map)
        material.map.anisotropy = Math.min(
          8,
          renderer.capabilities.getMaxAnisotropy(),
        );
      if (material.normalMap)
        material.normalMap.anisotropy = Math.min(
          8,
          renderer.capabilities.getMaxAnisotropy(),
        );
    });
  });
  scene.add(model.scene);
  const blindFabric = model.scene.getObjectByName("BLIND_Fabric");
  const extraTextures = new Set();
  fabrics.forEach((material) => {
    for (const slot of ["map", "normalMap", "bumpMap"]) {
      if (material[slot]) {
        extraTextures.add(material[slot]);
        material[slot] = material[slot].clone();
        material[slot].wrapT = THREE.RepeatWrapping;
        extraTextures.add(material[slot]);
      }
    }
    material.userData.fabricMap = material.map;
  });
  const mixer = new THREE.AnimationMixer(model.scene);
  const blindClip =
    model.animations.find((clip) => clip.name === "Blind_Close") ||
    model.animations.find((clip) => /blind/i.test(clip.name));
  if (!blindClip)
    throw new Error("The model is missing its Blind_Close animation.");
  const blindAction = mixer.clipAction(blindClip);
  blindAction.setLoop(THREE.LoopOnce, 1);
  blindAction.clampWhenFinished = true;
  blindAction.play();
  blindAction.paused = true;
  const cameraClip = model.animations.find((clip) =>
    /Camera_Travel/i.test(clip.name),
  );
  const exportedCamera = model.cameras.find(
    (item) => item.name === "CAMERA_Hero",
  );
  let cinemaAction;
  if (cameraClip) {
    cinemaAction = mixer.clipAction(cameraClip);
    cinemaAction.play();
    cinemaAction.paused = true;
  }

  let openness = 0.7;
  let motion = null;
  let cameraTransition = null;
  let cinema = false;
  let cinemaTime = 0;
  let lighting = "golden";
  let desiredLight = { ...LIGHTS.golden };
  let currentLight = { ...LIGHTS.golden };
  let active = true;
  let disposed = false;
  let dirty = 4;
  let raf = 0;
  let previousTime = performance.now();

  function updateLighting(dt = 1) {
    const t = dt === 1 ? 1 : 1 - Math.exp(-dt * 3.5);
    let changed = false;
    for (const key of [
      "sunPower",
      "ambient",
      "window",
      "lamp",
      "exterior",
      "exposure",
    ]) {
      if (Math.abs(currentLight[key] - desiredLight[key]) > 0.001)
        changed = true;
      currentLight[key] = THREE.MathUtils.lerp(
        currentLight[key],
        desiredLight[key],
        t,
      );
    }
    hemi.color.lerp(new THREE.Color(desiredLight.sky), t);
    sun.color.lerp(new THREE.Color(desiredLight.sun), t);
    scene.background.lerp(new THREE.Color(desiredLight.background), t);
    sun.intensity = currentLight.sunPower;
    hemi.intensity = currentLight.ambient * (0.45 + openness * 0.55);
    scene.environmentIntensity = currentLight.ambient * (0.3 + openness * 0.3);
    windowLight.intensity = currentLight.window * (0.04 + openness * 0.96);
    lamp.intensity = currentLight.lamp;
    outdoorMaterials.forEach((material) => {
      material.emissiveIntensity = currentLight.exterior;
      material.color.setScalar(currentLight.exterior);
    });
    fill.intensity = lighting === "night" ? 0.45 : 0.75 + openness * 0.45;
    renderer.toneMappingExposure = currentLight.exposure;
    if (changed) dirty = Math.max(dirty, 2);
  }

  function setOpenness(value) {
    openness = clamp(value, 0, 1);
    blindAction.time = (1 - openness) * blindClip.duration;
    mixer.update(0);
    if (blindFabric)
      fabrics.forEach((material) => {
        for (const slot of ["map", "normalMap", "bumpMap"])
          if (material[slot]) material[slot].repeat.y = blindFabric.scale.y;
      });
    renderer.shadowMap.needsUpdate = true;
    updateLighting(0);
    dirty = 3;
  }

  function cameraPose(view) {
    if (view === "detail")
      return {
        position: new THREE.Vector3(-0.1, 2.4, 2.5),
        target: new THREE.Vector3(-0.8, 2.2, -2.4),
      };
    return {
      position: new THREE.Vector3(
        mobile() ? 1.3 : 1.6,
        2.5,
        mobile() ? 6.7 : 6.1,
      ),
      target: new THREE.Vector3(0.25, 1.8, -1.9),
    };
  }

  function setView(view, instant = false) {
    cinema = view === "cinema";
    cinemaTime = 0;
    controls.enabled = !cinema;
    const pose = cameraPose(view);
    if (cinema && cinemaAction && exportedCamera) {
      cinemaAction.time = 0;
      mixer.update(0);
      model.scene.updateMatrixWorld(true);
      exportedCamera.getWorldPosition(pose.position);
      const direction = new THREE.Vector3();
      exportedCamera.getWorldDirection(direction);
      pose.target.copy(pose.position).addScaledVector(direction, 7);
    }
    if (instant || reducedMotion) {
      camera.position.copy(pose.position);
      controls.target.copy(pose.target);
      controls.update();
      cameraTransition = null;
    } else {
      cameraTransition = {
        fromPosition: camera.position.clone(),
        fromTarget: controls.target.clone(),
        toPosition: pose.position,
        toTarget: pose.target,
        time: 0,
      };
    }
    dirty = 3;
  }

  function setFabric(name) {
    fabrics.forEach((material) => {
      // The authored albedo is already charcoal. Lighter colorways use a solid
      // albedo with the same woven normal map, rather than multiply it by black.
      material.map = name === "carbon" ? material.userData.fabricMap : null;
      material.color.set(
        name === "carbon" ? "#ffffff" : FABRICS[name] || FABRICS.carbon,
      );
      material.needsUpdate = true;
    });
    setOpenness(openness);
    dirty = 3;
  }

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.fov = mobile()
      ? THREE.MathUtils.radToDeg(
          2 *
            Math.atan(
              Math.tan(THREE.MathUtils.degToRad(39) / 2) *
                Math.max(1, 0.93 / camera.aspect),
            ),
        )
      : 37;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, mobile() ? 1.5 : 1.75),
    );
    lamp.castShadow = !mobile();
    controls.touches.ONE = mobile() ? null : THREE.TOUCH.ROTATE;
    renderer.domElement.style.touchAction = mobile() ? "pan-y" : "none";
    renderer.shadowMap.needsUpdate = true;
    document.querySelector("#scene-hint").innerHTML = mobile()
      ? "Explora con dos dedos <span>·</span> Desliza para ver los controles"
      : "Arrastra para explorar <span>·</span> Acerca para ver la textura";
    dirty = 3;
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      active = entry.isIntersecting;
      dirty = 3;
    },
    { threshold: 0.01 },
  );
  intersectionObserver.observe(container);
  controls.addEventListener("start", () => {
    cameraTransition = null;
    cinema = false;
    events.onCameraManual?.();
  });
  controls.addEventListener("change", () => {
    dirty = Math.max(dirty, 2);
  });

  // Keyboard equivalents for drag and zoom; controls remain reachable on touch devices.
  function onKey(event) {
    if (
      ![
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "+",
        "-",
        "=",
        "Home",
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    cinema = false;
    controls.enabled = true;
    cameraTransition = null;
    if (event.key === "Home") {
      setView("room");
      return;
    }
    const offset = camera.position.clone().sub(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    if (event.key === "ArrowLeft") spherical.theta -= 0.06;
    if (event.key === "ArrowRight") spherical.theta += 0.06;
    if (event.key === "ArrowUp") spherical.phi -= 0.04;
    if (event.key === "ArrowDown") spherical.phi += 0.04;
    if (event.key === "+" || event.key === "=") spherical.radius *= 0.94;
    if (event.key === "-") spherical.radius *= 1.06;
    camera.position
      .copy(controls.target)
      .add(offset.setFromSpherical(spherical));
    controls.update();
    events.onCameraManual?.();
    dirty = 3;
  }
  container.addEventListener("keydown", onKey);

  function tick(now) {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;
    if (!active || document.hidden) return;
    if (motion) {
      motion.time += dt;
      const t = clamp(motion.time / motion.duration, 0, 1);
      setOpenness(THREE.MathUtils.lerp(motion.from, motion.to, smooth(t)));
      events.onOpenness?.(openness);
      if (t === 1) {
        motion = null;
        events.onComplete?.();
      }
    }
    if (cameraTransition) {
      cameraTransition.time += dt;
      const t = smooth(clamp(cameraTransition.time / 1.8, 0, 1));
      camera.position.lerpVectors(
        cameraTransition.fromPosition,
        cameraTransition.toPosition,
        t,
      );
      controls.target.lerpVectors(
        cameraTransition.fromTarget,
        cameraTransition.toTarget,
        t,
      );
      camera.lookAt(controls.target);
      if (t === 1) cameraTransition = null;
      dirty = 2;
    } else if (cinema) {
      cinemaTime += dt;
      if (cinemaAction && exportedCamera) {
        const phase = (1 - Math.cos((cinemaTime / 12) * Math.PI)) * 0.5;
        cinemaAction.time = phase * cameraClip.duration;
        mixer.update(0);
        model.scene.updateMatrixWorld(true);
        exportedCamera.getWorldPosition(camera.position);
        exportedCamera.getWorldQuaternion(camera.quaternion);
      } else {
        camera.position.set(
          2.5 + Math.sin(cinemaTime * 0.13) * 1.05,
          2.3 + Math.sin(cinemaTime * 0.18) * 0.15,
          6.3 + Math.cos(cinemaTime * 0.13) * 0.5,
        );
        camera.lookAt(-0.4, 1.8, -1.4);
      }
      dirty = 2;
    } else controls.update();
    updateLighting(dt);
    if (dirty > 0) {
      composer && !mobile()
        ? composer.render()
        : renderer.render(scene, camera);
      dirty--;
    }
  }
  setView("room", true);
  setOpenness(0.7);
  updateLighting();
  resize();
  renderer.compile(scene, camera);
  events.onProgress?.(100);
  raf = requestAnimationFrame(tick);

  return {
    setOpenness,
    setFabric,
    setView,
    setLighting(name) {
      lighting = name in LIGHTS ? name : "golden";
      desiredLight = { ...LIGHTS[lighting] };
      if (reducedMotion) updateLighting();
      dirty = 3;
    },
    animateTo(value) {
      motion = { from: openness, to: value, time: 0, duration: 6 };
    },
    stop() {
      motion = null;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener("keydown", onKey);
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        onContextLost,
      );
      controls.dispose();
      mixer.stopAllAction();
      model.scene.traverse((object) => object.geometry?.dispose());
      const textures = new Set();
      materials.forEach((material) => {
        Object.values(material).forEach((value) => {
          if (value?.isTexture) textures.add(value);
        });
        material.dispose();
      });
      textures.forEach((texture) => texture.dispose());
      extraTextures.forEach((texture) => texture.dispose());
      environment.dispose();
      composer?.passes.forEach((pass) => pass.dispose?.());
      composer?.dispose();
      sun.shadow.dispose();
      lamp.shadow.dispose();
      renderer.dispose();
    },
  };
}
