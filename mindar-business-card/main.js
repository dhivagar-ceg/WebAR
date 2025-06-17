import { MindARThree } from 'https://cdn.jsdelivr.net/npm/mind-ar@1.1.5/dist/mindar-image-three.prod.js';

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

const start = async () => {
  const mindarThree = new MindARThree({
    container: document.querySelector('#ar-container'),
    imageTargetSrc: './target.mind'
  });

  const { renderer, scene, camera } = mindarThree;

  const anchor = mindarThree.addAnchor(0);

  // Show a transparent plane on detected target
  const textureLoader = new THREE.TextureLoader();
  const texture = await textureLoader.loadAsync('./target-image.png');

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 0.75),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true })
  );

  anchor.group.add(plane);

  await mindarThree.start();

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
};

start();
