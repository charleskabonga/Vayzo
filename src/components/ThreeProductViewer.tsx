/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RotateCcw, ZoomIn, Eye, Sparkles, Layers, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

interface ThreeProductViewerProps {
  modelType: 'mealie_meal_sack' | 'cooking_oil_jug' | 'honey_jar' | 'tea_tin';
  productName: string;
  fallbackImageUrl?: string;
  className?: string;
}

export const ThreeProductViewer: React.FC<ThreeProductViewerProps> = ({
  modelType,
  productName,
  fallbackImageUrl,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isControlsExpanded, setIsControlsExpanded] = useState(true);
  const [lightingPreset, setLightingPreset] = useState<'studio' | 'warm'>('studio');
  const [finishVariant, setFinishVariant] = useState<'standard' | 'reserve' | 'vintage'>('standard');
  const [explodedAmount, setExplodedAmount] = useState<number>(0);
  const [isRotating, setIsRotating] = useState(true);
  const [webglSupported, setWebglSupported] = useState(true);

  // References to communicate with Three.js animation loop without re-triggering scene mount
  const paramsRef = useRef({
    explodedAmount: 0,
    isRotating: true,
    lightingPreset: 'studio',
    finishVariant: 'standard',
    modelType
  });

  paramsRef.current = {
    explodedAmount,
    isRotating,
    lightingPreset,
    finishVariant,
    modelType
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect software WebGL safely
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f7f5);
    scene.fog = new THREE.FogExp2(0xf5f7f5, 0.04);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(2.8, 1.8, 3.2);

    // WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Mandatory RoomEnvironment for studio PBR reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-point lighting
    const keyLight = new THREE.DirectionalLight(0xfff6eb, 2.2);
    keyLight.position.set(4, 5, 3);
    keyLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0xddeef8, 0x444433, 1.2);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xcce8ff, 1.4);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    // Soft Ground Contact Shadow Plane
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(15, 30, 20, 0.45)');
    grad.addColorStop(0.5, 'rgba(15, 30, 20, 0.18)');
    grad.addColorStop(1, 'rgba(15, 30, 20, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.002;
    scene.add(shadowMesh);

    // Procedural Texture Generator Helpers
    function createBurlapTexture() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#e5d3b3';
      ctx.fillRect(0, 0, 512, 512);

      // Weave grain pattern
      ctx.strokeStyle = '#c4af8c';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 512; i += 6) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
      }
      ctx.strokeStyle = '#b89f76';
      for (let j = 0; j < 512; j += 6) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(512, j);
        ctx.stroke();
      }
      // Stamp Brand Print "VAYZO BREAKFAST MEAL"
      ctx.fillStyle = '#1c5e32';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VAYZO SELECT', 256, 210);
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('BREAKFAST MEAL', 256, 265);
      ctx.fillStyle = '#a8201a';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('SUPER ROLLER • 25 KG', 256, 310);
      ctx.strokeStyle = '#1c5e32';
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 150, 432, 190);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    }

    // Procedural Label Texture for Oil Jug
    function createOilLabelTexture() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 0, 512, 35);
      ctx.fillRect(0, 221, 512, 35);

      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("D'LITE PURE OIL", 256, 110);
      ctx.fillStyle = '#4b5563';
      ctx.font = '22px sans-serif';
      ctx.fillText('Triple-Refined Vegetable Oil • 2.5 Litres', 256, 150);
      ctx.fillStyle = '#16a34a';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Zambian Heart Healthy Standard', 256, 185);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    // Root model group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Distinct parts references for exploded view
    const movableParts: { mesh: THREE.Object3D; baseOffset: THREE.Vector3; explodeDir: THREE.Vector3 }[] = [];

    // Assemble Composite 3-12 Part Procedural Model based on modelType
    if (modelType === 'mealie_meal_sack') {
      // 1. Primary silhouette: Main burlap sack body
      const sackGeo = new THREE.CylinderGeometry(0.55, 0.58, 1.35, 24, 8);
      // Soften cylinder to look like a full flour sack
      const pos = sackGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const bulge = Math.sin(((y + 0.675) / 1.35) * Math.PI) * 0.12;
        pos.setX(i, pos.getX(i) * (1 + bulge));
        pos.setZ(i, pos.getZ(i) * (1 + bulge * 0.9));
      }
      sackGeo.computeVertexNormals();

      const sackMat = new THREE.MeshStandardMaterial({
        map: createBurlapTexture(),
        roughness: 0.88,
        metalness: 0.05
      });
      const sackMesh = new THREE.Mesh(sackGeo, sackMat);
      sackMesh.castShadow = !isSoftwareGl;
      sackMesh.position.y = 0.7;
      rootGroup.add(sackMesh);
      movableParts.push({ mesh: sackMesh, baseOffset: new THREE.Vector3(0, 0.7, 0), explodeDir: new THREE.Vector3(0, 0, 0) });

      // 2. Secondary read: Pleated stitched sack top closure
      const topGeo = new THREE.CylinderGeometry(0.38, 0.52, 0.22, 24);
      const topMat = new THREE.MeshStandardMaterial({
        color: 0xd9c5a3,
        roughness: 0.95,
        metalness: 0.02
      });
      const topMesh = new THREE.Mesh(topGeo, topMat);
      topMesh.castShadow = !isSoftwareGl;
      topMesh.position.y = 1.45;
      rootGroup.add(topMesh);
      movableParts.push({ mesh: topMesh, baseOffset: new THREE.Vector3(0, 1.45, 0), explodeDir: new THREE.Vector3(0, 0.6, 0) });

      // 3. Accent detail: Stitched twine thread seal
      const twineGeo = new THREE.TorusGeometry(0.39, 0.035, 12, 32);
      const twineMat = new THREE.MeshStandardMaterial({
        color: 0x991b1b, // Red inspection cord
        roughness: 0.65,
        metalness: 0.1
      });
      const twineMesh = new THREE.Mesh(twineGeo, twineMat);
      twineMesh.rotation.x = Math.PI / 2;
      twineMesh.position.y = 1.38;
      rootGroup.add(twineMesh);
      movableParts.push({ mesh: twineMesh, baseOffset: new THREE.Vector3(0, 1.38, 0), explodeDir: new THREE.Vector3(0, 0.9, 0) });

      // 4. Accent detail: Certification tag
      const tagGeo = new THREE.BoxGeometry(0.18, 0.28, 0.02);
      const tagMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        roughness: 0.4,
        metalness: 0.15
      });
      const tagMesh = new THREE.Mesh(tagGeo, tagMat);
      tagMesh.position.set(0.35, 1.25, 0.3);
      tagMesh.rotation.set(0.2, 0.4, -0.3);
      rootGroup.add(tagMesh);
      movableParts.push({ mesh: tagMesh, baseOffset: new THREE.Vector3(0.35, 1.25, 0.3), explodeDir: new THREE.Vector3(0.4, 0.5, 0.3) });

    } else if (modelType === 'cooking_oil_jug') {
      // 1. Primary silhouette: Translucent bottle body with ribbed grooves
      const bottleGeo = new THREE.CylinderGeometry(0.48, 0.52, 1.25, 28);
      const bottleMat = new THREE.MeshPhysicalMaterial({
        color: 0xfacc15,
        roughness: 0.18,
        metalness: 0.05,
        transmission: isSoftwareGl ? 0 : 0.85,
        transparent: true,
        opacity: isSoftwareGl ? 0.85 : 0.92,
        ior: 1.47,
        clearcoat: 0.9
      });
      const bottleMesh = new THREE.Mesh(bottleGeo, bottleMat);
      bottleMesh.castShadow = !isSoftwareGl;
      bottleMesh.position.y = 0.65;
      rootGroup.add(bottleMesh);
      movableParts.push({ mesh: bottleMesh, baseOffset: new THREE.Vector3(0, 0.65, 0), explodeDir: new THREE.Vector3(0, 0, 0) });

      // 2. Secondary read: Ergonomic bottle handle
      const handleCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0.48, 0.3, 0),
        new THREE.Vector3(0.85, 0.7, 0),
        new THREE.Vector3(0.48, 1.05, 0)
      );
      const handleGeo = new THREE.TubeGeometry(handleCurve, 16, 0.065, 8, false);
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0xeab308,
        roughness: 0.25,
        metalness: 0.1
      });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      rootGroup.add(handleMesh);
      movableParts.push({ mesh: handleMesh, baseOffset: new THREE.Vector3(0, 0, 0), explodeDir: new THREE.Vector3(0.5, 0, 0) });

      // 3. Accent detail: Product label band
      const labelGeo = new THREE.CylinderGeometry(0.505, 0.505, 0.55, 28, 1, true);
      const labelMat = new THREE.MeshStandardMaterial({
        map: createOilLabelTexture(),
        roughness: 0.35,
        metalness: 0.05
      });
      const labelMesh = new THREE.Mesh(labelGeo, labelMat);
      labelMesh.position.y = 0.62;
      rootGroup.add(labelMesh);
      movableParts.push({ mesh: labelMesh, baseOffset: new THREE.Vector3(0, 0.62, 0), explodeDir: new THREE.Vector3(0, 0, 0.4) });

      // 4. Accent detail: Ribbed screw cap
      const neckGeo = new THREE.CylinderGeometry(0.2, 0.32, 0.2, 20);
      const neckMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.3 });
      const neckMesh = new THREE.Mesh(neckGeo, neckMat);
      neckMesh.position.y = 1.35;
      rootGroup.add(neckMesh);

      const capGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.16, 24);
      const capMat = new THREE.MeshStandardMaterial({
        color: 0x16a34a, // Fresh Green Cap
        roughness: 0.2,
        metalness: 0.3
      });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.y = 1.48;
      rootGroup.add(capMesh);
      movableParts.push({ mesh: capMesh, baseOffset: new THREE.Vector3(0, 1.48, 0), explodeDir: new THREE.Vector3(0, 0.7, 0) });

    } else if (modelType === 'honey_jar') {
      // 1. Primary silhouette: Hexagonal Glass Jar
      const jarGeo = new THREE.CylinderGeometry(0.48, 0.5, 0.85, 6);
      const jarMat = new THREE.MeshPhysicalMaterial({
        color: 0xd97706,
        roughness: 0.12,
        metalness: 0.08,
        transmission: isSoftwareGl ? 0 : 0.82,
        transparent: true,
        opacity: isSoftwareGl ? 0.9 : 0.95,
        ior: 1.52,
        clearcoat: 1.0
      });
      const jarMesh = new THREE.Mesh(jarGeo, jarMat);
      jarMesh.castShadow = !isSoftwareGl;
      jarMesh.position.y = 0.45;
      rootGroup.add(jarMesh);
      movableParts.push({ mesh: jarMesh, baseOffset: new THREE.Vector3(0, 0.45, 0), explodeDir: new THREE.Vector3(0, 0, 0) });

      // 2. Secondary read: Gold Foil Sealed Twist Lid
      const lidGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.16, 28);
      const lidMat = new THREE.MeshStandardMaterial({
        color: 0xeab308,
        roughness: 0.2,
        metalness: 0.85
      });
      const lidMesh = new THREE.Mesh(lidGeo, lidMat);
      lidMesh.position.y = 0.95;
      rootGroup.add(lidMesh);
      movableParts.push({ mesh: lidMesh, baseOffset: new THREE.Vector3(0, 0.95, 0), explodeDir: new THREE.Vector3(0, 0.6, 0) });

      // 3. Accent detail: Wooden Honey Dipper accessory
      const dipperHandleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12);
      const dipperHeadGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16);
      const woodMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 });

      const dipperGroup = new THREE.Group();
      const dipperHandle = new THREE.Mesh(dipperHandleGeo, woodMat);
      const dipperHead = new THREE.Mesh(dipperHeadGeo, woodMat);
      dipperHead.position.y = 0.3;
      dipperGroup.add(dipperHandle);
      dipperGroup.add(dipperHead);
      dipperGroup.position.set(0.62, 0.42, 0.15);
      dipperGroup.rotation.set(0.1, 0, -0.4);
      rootGroup.add(dipperGroup);
      movableParts.push({ mesh: dipperGroup, baseOffset: new THREE.Vector3(0.62, 0.42, 0.15), explodeDir: new THREE.Vector3(0.5, 0.3, 0) });

    } else {
      // tea_tin: Embossed Tea Collector Tin
      const tinGeo = new THREE.CylinderGeometry(0.44, 0.44, 1.1, 32);
      const tinMat = new THREE.MeshStandardMaterial({
        color: 0x0f392b, // Forest green enamel
        roughness: 0.25,
        metalness: 0.6
      });
      const tinMesh = new THREE.Mesh(tinGeo, tinMat);
      tinMesh.castShadow = !isSoftwareGl;
      tinMesh.position.y = 0.58;
      rootGroup.add(tinMesh);
      movableParts.push({ mesh: tinMesh, baseOffset: new THREE.Vector3(0, 0.58, 0), explodeDir: new THREE.Vector3(0, 0, 0) });

      // Copper metallic lid
      const lidGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.2, 32);
      const lidMat = new THREE.MeshStandardMaterial({
        color: 0xb45309, // Polished copper
        roughness: 0.15,
        metalness: 0.95
      });
      const lidMesh = new THREE.Mesh(lidGeo, lidMat);
      lidMesh.position.y = 1.18;
      rootGroup.add(lidMesh);
      movableParts.push({ mesh: lidMesh, baseOffset: new THREE.Vector3(0, 1.18, 0), explodeDir: new THREE.Vector3(0, 0.6, 0) });
    }

    // Touch & Mouse Orbit Controls Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationY = 0;
    let targetRotationX = 0;
    let targetZoom = 3.6;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      targetRotationY += dx * 0.008;
      targetRotationX = Math.max(-0.6, Math.min(0.8, targetRotationX + dy * 0.008));
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetZoom = Math.max(1.8, Math.min(5.5, targetZoom + e.deltaY * 0.003));
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop with exponential damping & software-gl protection
    let animationFrameId = 0;
    let timeoutId: number | undefined;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          timeoutId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          timeoutId = window.setTimeout(cb, 60);
        }
      };
      timeoutId = window.setTimeout(poll, 5);
    }

    const clock = new THREE.Clock();

    const tick = () => {
      const dt = clock.getDelta();

      // Auto rotation when enabled and not actively dragging
      if (paramsRef.current.isRotating && !isDragging) {
        targetRotationY += dt * 0.35;
      }

      // Smooth camera damping
      rootGroup.rotation.y = THREE.MathUtils.damp(rootGroup.rotation.y, targetRotationY, 8, dt);
      rootGroup.rotation.x = THREE.MathUtils.damp(rootGroup.rotation.x, targetRotationX, 8, dt);

      // Camera distance damping
      const currentDist = camera.position.length();
      const newDist = THREE.MathUtils.damp(currentDist, targetZoom, 6, dt);
      camera.position.normalize().multiplyScalar(newDist);
      camera.lookAt(0, 0.7, 0);

      // Update exploded view positions with damping
      const expAmount = paramsRef.current.explodedAmount;
      for (const part of movableParts) {
        const targetPos = part.baseOffset.clone().addScaledVector(part.explodeDir, expAmount);
        part.mesh.position.lerp(targetPos, 0.15);
      }

      // Dynamic light presets
      if (paramsRef.current.lightingPreset === 'warm') {
        keyLight.color.setHex(0xffaa44);
        keyLight.intensity = 2.4;
      } else {
        keyLight.color.setHex(0xfff6eb);
        keyLight.intensity = 2.0;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    tick();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 600;
      const newH = container.clientHeight || 450;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);

      renderer.dispose();
      if (dom.parentElement) {
        dom.parentElement.removeChild(dom);
      }
    };
  }, [modelType]);

  const handleResetCamera = () => {
    setIsRotating(true);
    setExplodedAmount(0);
  };

  return (
    <div className={`relative w-full h-[460px] md:h-[520px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60 shadow-xl ${className}`}>
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Spec & Verified Model Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <span className="px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 rounded-full shadow">
          Three.js Studio 3D
        </span>
        <span className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800/80 rounded-full border border-slate-700">
          PBR Real-time
        </span>
      </div>

      {/* Top Right Quick Reset & Auto-Rotate Toggle */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setIsRotating(!isRotating)}
          aria-label={isRotating ? 'Pause 3D rotation' : 'Resume 3D rotation'}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition ${
            isRotating
              ? 'bg-emerald-600/90 text-white hover:bg-emerald-500'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
          }`}
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          {isRotating ? 'Spinning' : 'Paused'}
        </button>

        <button
          onClick={handleResetCamera}
          aria-label="Reset 3D camera angle"
          className="p-1.5 text-slate-300 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-lg"
          title="Reset View"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Ergonomic Collapsible Bottom Control Dock (<= 15% viewport footprint) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-md">
        {/* Collapse / Expand Toggle Tab */}
        <div className="flex justify-center -mb-px">
          <button
            onClick={() => setIsControlsExpanded(!isControlsExpanded)}
            className="px-3 py-1 bg-slate-900/95 text-slate-300 text-xs font-medium rounded-t-lg border-t border-x border-slate-700/80 flex items-center gap-1 shadow-sm hover:text-white"
          >
            {isControlsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            {isControlsExpanded ? 'Hide 3D Dock' : 'Inspect 3D Controls'}
          </button>
        </div>

        {/* Floating Dock Content */}
        {isControlsExpanded && (
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-slate-200">
            <div className="space-y-2.5">
              {/* Exploded / Component Separation Slider */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Explode Parts
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={explodedAmount}
                  onChange={(e) => {
                    setExplodedAmount(parseFloat(e.target.value));
                    setIsRotating(false);
                  }}
                  className="w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  aria-label="Explode 3D components slider"
                />
                <span className="text-[11px] text-slate-400 font-mono w-7 text-right">
                  {Math.round(explodedAmount * 100)}%
                </span>
              </div>

              {/* Lighting & Finishes */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400">Light:</span>
                  <button
                    onClick={() => setLightingPreset('studio')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      lightingPreset === 'studio' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Daylight
                  </button>
                  <button
                    onClick={() => setLightingPreset('warm')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      lightingPreset === 'warm' ? 'bg-amber-900/60 text-amber-200 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Warm Amber
                  </button>
                </div>

                <span className="text-[11px] text-slate-400">Drag to orbit • Scroll to zoom</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {!webglSupported && fallbackImageUrl && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/90 p-6 text-center">
          <img src={fallbackImageUrl} alt={productName} className="w-48 h-48 object-contain rounded-xl mb-3 shadow" />
          <p className="text-sm text-slate-300 font-medium">3D acceleration disabled on this device.</p>
          <p className="text-xs text-slate-400">Displaying high-resolution certified photograph.</p>
        </div>
      )}
    </div>
  );
};
