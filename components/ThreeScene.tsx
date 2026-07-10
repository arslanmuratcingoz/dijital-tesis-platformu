'use client';

import { useEffect, useRef } from 'react';
import { ProjectState } from '@/types/project';

export function ThreeScene({ state }: { state: ProjectState }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    async function run() {
      const THREE = await import('three');
      if (!hostRef.current || disposed) return;
      const host = hostRef.current;
      host.innerHTML = '';
      const width = host.clientWidth || 900;
      const height = host.clientHeight || 650;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f7fa);
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
      camera.position.set(90, 80, 110);
      camera.lookAt(0, 0, 0);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      host.appendChild(renderer.domElement);

      const hemi = new THREE.HemisphereLight(0xffffff, 0xd8dde5, 1.1);
      scene.add(hemi);
      const dir = new THREE.DirectionalLight(0xffffff, 1.7);
      dir.position.set(70, 120, 65);
      dir.castShadow = true;
      scene.add(dir);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500, 60, 60),
        new THREE.MeshStandardMaterial({ color: 0xf0f3f7, roughness: 0.9, metalness: 0.02 })
      );
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);
      const grid = new THREE.GridHelper(500, 50, 0xb5beca, 0xd4dce5);
      scene.add(grid);

      const layerVisible = new Map(state.layers.map((l) => [l.id, l.visible]));
      for (const b of state.buildings || []) {
        if (b.layerId && layerVisible.get(b.layerId) === false) continue;
        const geo = new THREE.BoxGeometry(b.width, b.height, b.depth);
        const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(b.wallColor || '#d7dde5'), transparent: true, opacity: b.opacity ?? .58, roughness: .65 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(b.x, b.height / 2, b.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x778393 }));
        line.position.copy(mesh.position);
        scene.add(line);
      }

      for (const cg of state.columnGrids || []) {
        if (!cg.visible) continue;
        const rows = cg.rows || [];
        for (let r = 0; r < rows.length; r++) {
          for (let c = 0; c < cg.columns; c++) {
            const geo = new THREE.BoxGeometry(cg.columnWidth, cg.columnHeight, cg.columnWidth);
            const mat = new THREE.MeshStandardMaterial({ color: 0x8a96a5, roughness: 0.8 });
            const m = new THREE.Mesh(geo, mat);
            m.position.set(cg.originX + c * cg.columnSpacing, cg.columnHeight / 2, cg.originZ + r * cg.rowSpacing);
            scene.add(m);
          }
        }
      }

      for (const a of state.assets || []) {
        if (a.layerId && layerVisible.get(a.layerId) === false) continue;
        const geo = new THREE.BoxGeometry(a.width, a.height, a.depth);
        const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(a.color || '#b87815'), roughness: .62, metalness: .05 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(a.x, (a.y || 0) + a.height / 2, a.z);
        mesh.rotation.y = (a.rotation || 0) * Math.PI / 180;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x313b49 }));
        line.position.copy(mesh.position);
        line.rotation.copy(mesh.rotation);
        scene.add(line);
      }

      let dragging = false;
      let lastX = 0, lastY = 0;
      let yaw = Math.atan2(camera.position.x, camera.position.z);
      let radius = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
      let pitch = camera.position.y;
      const updateCam = () => {
        camera.position.set(Math.sin(yaw) * radius, pitch, Math.cos(yaw) * radius);
        camera.lookAt(0, 0, 0);
      };
      const down = (e: PointerEvent) => { dragging = true; lastX = e.clientX; lastY = e.clientY; renderer.domElement.setPointerCapture(e.pointerId); };
      const move = (e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        yaw -= dx * 0.006;
        pitch = Math.max(18, Math.min(190, pitch + dy * 0.35));
        updateCam();
      };
      const up = () => { dragging = false; };
      const wheel = (e: WheelEvent) => { e.preventDefault(); radius = Math.max(25, Math.min(320, radius + e.deltaY * 0.08)); updateCam(); };
      renderer.domElement.addEventListener('pointerdown', down);
      renderer.domElement.addEventListener('pointermove', move);
      renderer.domElement.addEventListener('pointerup', up);
      renderer.domElement.addEventListener('wheel', wheel, { passive: false });

      const onResize = () => {
        if (!host) return;
        const w = host.clientWidth || width;
        const h = host.clientHeight || height;
        camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);
      let raf = 0;
      const animate = () => { raf = requestAnimationFrame(animate); renderer.render(scene, camera); };
      animate();
      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        renderer.domElement.removeEventListener('pointerdown', down);
        renderer.domElement.removeEventListener('pointermove', move);
        renderer.domElement.removeEventListener('pointerup', up);
        renderer.domElement.removeEventListener('wheel', wheel);
        renderer.dispose();
        host.innerHTML = '';
      };
    }
    run();
    return () => { disposed = true; cleanup(); };
  }, [state]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />;
}
