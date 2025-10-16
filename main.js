// Simple three.js example

import * as THREE from "https://unpkg.com/three@0.112/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.112/examples/jsm/controls/OrbitControls.js";


let camera, scene, renderer;
let isUserInteracting = false,
    onPointerDownMouseX = 0, onPointerDownMouseY = 0,
    lon = 0, onPointerDownLon = 0,
    lat = 0, onPointerDownLat = 0;

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.target = new THREE.Vector3(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // --- Sphere of images ---
  const loader = new THREE.TextureLoader();
  const radius = 40;
  const cols = 8, rows = 6; // grid-like distribution
  const imgPaths = [
    'pngs/IMG_1495.png', 'pngs/IMG_1512.png','pngs/IMG_1542.png','pngs/1544.png',
    'pngs/1552.png','pngs/1558.png','pngs/1559.png','pngs/1560.png',
    'pngs/1562.png','pngs/1564.png','pngs/1566.png','pngs/1569.png',
    'pngs/1573.png','pngs/1575.png','pngs/1582.png','pngs/1583.png',
    'pngs/1587.png','pngs/1588.png','pngs/1596.png','pngs/1607.png',
    'pngs/1617.png','pngs/1619.png','pngs/1622.png','pngs/1636.png','pngs/screenshot.png'
  ];

  let i = 0;
  for (let y = 0; y < rows; y++) {
    const phi = (y / (rows - 1)) * Math.PI;
    for (let x = 0; x < cols; x++) {
      const theta = (x / cols) * 2 * Math.PI;
      const pos = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      ).multiplyScalar(radius);

      const tex = loader.load(imgPaths[i % imgPaths.length]);
      const geo = new THREE.PlaneGeometry(6, 4);
      const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.lookAt(0, 0, 0);
      mesh.rotateY(Math.PI); // faces inward
      scene.add(mesh);
      i++;
    }
  }

  // --- Mouse drag controls ---
  document.addEventListener('mousedown', onPointerDown);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);
  document.addEventListener('wheel', onDocumentMouseWheel);
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerDown(event) {
  isUserInteracting = true;
  onPointerDownMouseX = event.clientX;
  onPointerDownMouseY = event.clientY;
  onPointerDownLon = lon;
  onPointerDownLat = lat;
}

function onPointerMove(event) {
  if (isUserInteracting) {
    lon = (onPointerDownMouseX - event.clientX) * 0.1 + onPointerDownLon;
    lat = (event.clientY - onPointerDownMouseY) * 0.1 + onPointerDownLat;
  }
}

function onPointerUp() {
  isUserInteracting = false;
}

function onDocumentMouseWheel(event) {
  camera.fov += event.deltaY * 0.05;
  camera.fov = THREE.MathUtils.clamp(camera.fov, 30, 100);
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  lat = Math.max(-85, Math.min(85, lat));
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon);

  camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
  camera.target.y = 500 * Math.cos(phi);
  camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);
  camera.lookAt(camera.target);

  renderer.render(scene, camera);
}