import * as THREE from 'three';
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const start = async () => {
  const mindarThree = new MindARThree({
    container: document.querySelector("#ar-container"),
    imageTargetSrc: "./CarTarget.mind",
  });

  const { renderer, scene, camera } = mindarThree;
  const anchor = mindarThree.addAnchor(0);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 2, 2);
  scene.add(directionalLight);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  // Load GLB
  const gltfLoader = new GLTFLoader();
  const gltf = await gltfLoader.loadAsync("./2.glb");
  const avatar = gltf.scene;
  avatar.scale.set(0.4, 0.4, 0.4);
  avatar.rotation.x = Math.PI / 2;
  avatar.visible = false;

  avatar.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material.needsUpdate = true;
    }
  });

  const mixer = new THREE.AnimationMixer(avatar);
  let idleClip = THREE.AnimationClip.findByName(gltf.animations, "Armature_mixamo.com_Layer0");
  if (!idleClip && gltf.animations.length > 0) idleClip = gltf.animations[0];
  const idleAction = mixer.clipAction(idleClip);

  // Video Planes
  const videoPositions = [
    [-0.8, 0.25, 0],
    [-0.25, 0.25, 0],
    [0.25, 0.25, 0],
    [0.8, 0.25, 0]
  ];
  const videoFiles = ["video1.mp4", "video2.mp4", "video3.mp4", "video4.mp4"];
  const videoPlanes = [];

  for (let i = 0; i < videoFiles.length; i++) {
    const video = document.createElement("video");
    video.src = videoFiles[i];
    video.crossOrigin = "anonymous";
    video.loop = false;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const texture = new THREE.VideoTexture(video);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.4),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
    );
    plane.position.set(...videoPositions[i]);
    plane.visible = false;
    anchor.group.add(plane);
    videoPlanes.push({ plane, video });
  }

  // UI Utility Functions
  const createTextPlane = (label, x, y, callback, scale = 1) => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.4 * scale, 0.35 * scale), material);
    plane.position.set(x, y, 0);
    plane.userData = { onClick: callback };
    plane.visible = false;
    anchor.group.add(plane);
    return plane;
  };

  const websiteBtn = createTextPlane("www.bez.agency", -0.6, -0.5, () => {
    window.open("https://www.bez.agency", "_blank");
  }, 0.5);

  const contactBtn = createTextPlane("bez@gmail.com", 0.6, -0.5, () => {
    window.open("mailto:bez@gmail.com", "_blank");
  }, 0.5);

  const backButton = createTextPlane("← Back", -1.3, 0.9, () => {
    showMainMenu();
  }, 0.5);

  const caseStudyText = createTextPlane(
    "BezAgency\nAutomotive - Melbourne VIC\n10+ years in photo, video, strategy",
    0, 0.4, () => {}, 1.2
  );

  // Menu Buttons
  const menuButtons = [];
  const page1Btns = [
    { label: "our content", x: -1.2 },
    { label: "case studies", x: 0 },
    { label: "about us indepth\nour services", x: 1.2 }
  ];

  page1Btns.forEach(({ label, x }, idx) => {
    const btn = createTextPlane(label, x, 0.5, () => {
      if (idx === 0) showContentScene();
      else if (idx === 1) showCaseStudy();
      else alert(`${label} coming soon`);
    });
    menuButtons.push(btn);
  });

  const showMainMenu = () => {
    videoPlanes.forEach(({ plane, video }) => {
      plane.visible = false;
      video.pause();
    });
    avatar.visible = false;
    websiteBtn.visible = false;
    contactBtn.visible = false;
    caseStudyText.visible = false;
    backButton.visible = false;

    menuButtons.forEach(btn => {
      btn.visible = true;
    });
  };

  const showCaseStudy = () => {
    menuButtons.forEach(btn => btn.visible = false);
    avatar.visible = false;
    websiteBtn.visible = true;
    contactBtn.visible = true;
    caseStudyText.visible = true;
    backButton.visible = true;
  };

  const showContentScene = () => {
    menuButtons.forEach(btn => btn.visible = false);
    avatar.visible = true;
    websiteBtn.visible = true;
    contactBtn.visible = true;
    backButton.visible = true;

    videoPlanes.forEach(({ plane }) => {
      plane.visible = true;
    });

    playSequence();
  };

  const playSequence = async () => {
    for (let i = 0; i < videoPlanes.length; i++) {
      avatar.position.set(...videoPositions[i]);
      videoPlanes.forEach(({ video }, idx) => {
        if (i === idx) {
          video.currentTime = 0;
          video.play().catch(err => console.warn("Video play error", err));
        } else {
          video.pause();
        }
      });
      await new Promise(res => {
        const v = videoPlanes[i].video;
        const endCheck = () => {
          if (v.ended || v.currentTime === v.duration) res();
          else setTimeout(endCheck, 500);
        };
        endCheck();
      });
    }
  };

  // Intro Audio + Start Sequence
  const audio = new Audio("Bez.mp3");

  const startIntro = async () => {
    avatar.visible = true;
    anchor.group.add(avatar);
    idleAction.play();
    audio.play();
    await new Promise(res => setTimeout(res, audio.duration * 1000 || 20000));
    avatar.position.set(...videoPositions[0]);
    videoPlanes[0].plane.visible = true;
    videoPlanes[0].video.currentTime = 0;
    videoPlanes[0].video.play();
    websiteBtn.visible = true;
    contactBtn.visible = true;
    backButton.visible = true;
  };

  // Click Detection
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  window.addEventListener("click", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(anchor.group.children);
    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj.userData && typeof obj.userData.onClick === 'function') {
        obj.userData.onClick();
      }
    }
  });

  anchor.onTargetFound = () => {
    console.log("Target Found");
    showMainMenu();
    startIntro();
  };

  anchor.onTargetLost = () => {
    audio.pause();
    audio.currentTime = 0;
    videoPlanes.forEach(({ video }) => video.pause());
  };

  await mindarThree.start();

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    mixer.update(delta);
    renderer.render(scene, camera);
  });
};

start();
