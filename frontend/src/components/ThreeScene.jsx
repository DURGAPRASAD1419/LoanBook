import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

export default function ThreeScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 40);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    mount.appendChild(renderer.domElement);

    // CSS3D renderer for DOM panels in 3D space
    const cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(mount.clientWidth, mount.clientHeight);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = '0';
    cssRenderer.domElement.style.left = '0';
    cssRenderer.domElement.style.pointerEvents = 'none';
    mount.appendChild(cssRenderer.domElement);

    // Create a DOM container to host the app UI and expose it as a portal target
    let uiContainer = document.getElementById('three-ui-root');
    let appendedUiContainer = false;
    if (!uiContainer) {
      uiContainer = document.createElement('div');
      uiContainer.id = 'three-ui-root';
      uiContainer.style.width = '480px';
      uiContainer.style.height = '720px';
      uiContainer.style.pointerEvents = 'auto';
      document.body.appendChild(uiContainer);
      appendedUiContainer = true;
    }

    const cssObject = new CSS3DObject(uiContainer);
    // position the UI panel slightly in front of the floating card
    cssObject.position.set(0, 0, -1.5);
    cssObject.rotation.x = -0.06;
    cssObject.rotation.y = 0.08;
    cssObject.scale.set(1, 1, 1);
    scene.add(cssObject);

    // lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(10, 20, 10);
    scene.add(dir);

    // subtle background plane for depth
    const bgGeo = new THREE.PlaneGeometry(200, 200);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, side: THREE.BackSide });
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    bgMesh.position.z = -50;
    scene.add(bgMesh);

    // floating card just behind UI to give depth
    const cardGeo = new THREE.PlaneGeometry(22, 28, 1, 1);
    const cardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.05 });
    const card = new THREE.Mesh(cardGeo, cardMat);
    card.position.set(0, 0, -2);
    card.rotation.x = -0.06;
    card.rotation.y = 0.08;
    scene.add(card);

    // subtle rim highlight using second mesh
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xeff6ff, emissive: 0x114bff, emissiveIntensity: 0.02, transparent: true, opacity: 0.12 });
    const rim = new THREE.Mesh(cardGeo, rimMat);
    rim.position.copy(card.position);
    rim.scale.set(1.01, 1.01, 1.01);
    scene.add(rim);

    // small floating decorative cubes
    const cubes = [];
    for (let i = 0; i < 6; i++) {
      const g = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const m = new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.7, metalness: 0.1 });
      const cube = new THREE.Mesh(g, m);
      cube.position.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, -6 - Math.random() * 6);
      cube.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
      scene.add(cube);
      cubes.push(cube);
    }

    let mouseX = 0;
    let mouseY = 0;

    function onMove(e) {
      const rect = mount.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseX = (x - 0.5) * 2;
      mouseY = (y - 0.5) * 2;
    }

    window.addEventListener('mousemove', onMove);

    function onResize() {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }

    window.addEventListener('resize', onResize);

    let frame = 0;
    const animate = () => {
      frame += 0.01;
      // camera subtle parallax
      camera.position.x += (mouseX * 6 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 4 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // rotate cubes slowly
      cubes.forEach((c, idx) => {
        c.rotation.x += 0.002 + idx * 0.0005;
        c.rotation.y += 0.003 + idx * 0.0005;
      });

      // gentle tilt of card
      card.rotation.y = 0.04 + mouseX * 0.06;
      card.rotation.x = -0.06 + mouseY * 0.04;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      mount.removeChild(renderer.domElement);
      if (cssRenderer && cssRenderer.domElement && cssRenderer.domElement.parentNode === mount) {
        mount.removeChild(cssRenderer.domElement);
      }
      // remove CSS3D UI container if we appended it
      if (appendedUiContainer && uiContainer && uiContainer.parentNode === document.body) {
        document.body.removeChild(uiContainer);
      }
      // dispose geometry/materials
      cardGeo.dispose();
      cardMat.dispose();
      rimMat.dispose();
      bgGeo.dispose();
      bgMat.dispose();
      cubes.forEach((c) => {
        c.geometry.dispose();
        c.material.dispose();
      });
      renderer.dispose();
      // CSS3DRenderer does not provide dispose(); ensure DOM elements are removed instead
    };
  }, []);

  return (
    <div ref={mountRef} style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }} />
  );
}
