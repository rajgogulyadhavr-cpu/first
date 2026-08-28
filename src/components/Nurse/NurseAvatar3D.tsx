import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type NurseState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface NurseAvatar3DProps {
  state: NurseState;
  isAudioPlaying?: boolean;
}

export const NurseAvatar3D: React.FC<NurseAvatar3DProps> = ({ state, isAudioPlaying }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<NurseState>(state);
  const isAudioPlayingRef = useRef<boolean>(!!isAudioPlaying);
  const [webglSupported, setWebglSupported] = useState(true);

  // Keep refs synchronized for the requestAnimationFrame render loop
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    isAudioPlayingRef.current = !!isAudioPlaying;
  }, [isAudioPlaying]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch (e) {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 240;
    const height = container.clientHeight || 280;

    // Scene, Camera & Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 3.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.replaceChildren(renderer.domElement);

    // ----------------------------------------------------
    // Lighting Rig (Professional Medical Clinic Ambience)
    // ----------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    keyLight.position.set(2, 3.5, 2.5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xccfbf1, 1.1);
    fillLight.position.set(-2, 1.5, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x14b8a6, 1.4);
    rimLight.position.set(0, 2.5, -2.5);
    scene.add(rimLight);

    // ----------------------------------------------------
    // Materials
    // ----------------------------------------------------
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xf6c5a0,
      roughness: 0.55,
      metalness: 0.05,
    });

    const scrubMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f766e, // Professional Teal Medical Scrub
      roughness: 0.65,
      metalness: 0.1,
    });

    const whiteUniformMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
      metalness: 0.05,
    });

    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x271a15, // Dark Brunette
      roughness: 0.8,
      metalness: 0.05,
    });

    const redCrossMaterial = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Red Cross Emblem
      roughness: 0.3,
      metalness: 0.1,
    });

    const stethoscopeMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.2,
    });

    const stethoscopeTubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.1,
    });

    const eyeScleraMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
    });

    const eyeIrisMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.1,
      metalness: 0.2,
    });

    const mouthInteriorMaterial = new THREE.MeshStandardMaterial({
      color: 0x9f1239,
      roughness: 0.3,
    });

    const lipMaterial = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      roughness: 0.4,
    });

    // ----------------------------------------------------
    // Character Hierarchy
    // ----------------------------------------------------
    const characterGroup = new THREE.Group();
    scene.add(characterGroup);

    // Torso / Body (Scrub)
    const torsoGeometry = new THREE.CylinderGeometry(0.52, 0.68, 1.2, 32);
    const torso = new THREE.Mesh(torsoGeometry, scrubMaterial);
    torso.position.y = -0.7;
    torso.castShadow = true;
    torso.receiveShadow = true;
    characterGroup.add(torso);

    // Inner White Medical Shirt V-Neck
    const shirtGeometry = new THREE.ConeGeometry(0.28, 0.45, 16);
    const innerShirt = new THREE.Mesh(shirtGeometry, whiteUniformMaterial);
    innerShirt.position.set(0, -0.22, 0.48);
    innerShirt.rotation.x = Math.PI;
    characterGroup.add(innerShirt);

    // ID Badge / Nurse Cross Badge
    const badgeGeom = new THREE.BoxGeometry(0.18, 0.24, 0.04);
    const badge = new THREE.Mesh(badgeGeom, whiteUniformMaterial);
    badge.position.set(0.32, -0.45, 0.55);
    badge.rotation.y = -0.2;
    characterGroup.add(badge);

    const badgeClipGeom = new THREE.BoxGeometry(0.06, 0.05, 0.05);
    const badgeClip = new THREE.Mesh(badgeClipGeom, stethoscopeMetalMaterial);
    badgeClip.position.set(0.32, -0.31, 0.55);
    characterGroup.add(badgeClip);

    // 3D Stethoscope Drape
    const stethCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.28, 0.1, 0.25),
      new THREE.Vector3(-0.35, -0.25, 0.5),
      new THREE.Vector3(0, -0.55, 0.6),
      new THREE.Vector3(0.35, -0.25, 0.5),
      new THREE.Vector3(0.28, 0.1, 0.25),
    ]);
    const stethGeom = new THREE.TubeGeometry(stethCurve, 32, 0.024, 12, false);
    const stethTube = new THREE.Mesh(stethGeom, stethoscopeTubeMaterial);
    characterGroup.add(stethTube);

    // Stethoscope Chestpiece / Diaphragm
    const chestPieceGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 24);
    const chestPiece = new THREE.Mesh(chestPieceGeom, stethoscopeMetalMaterial);
    chestPiece.position.set(0, -0.56, 0.62);
    chestPiece.rotation.x = Math.PI / 2;
    characterGroup.add(chestPiece);

    // Neck
    const neckGeometry = new THREE.CylinderGeometry(0.2, 0.23, 0.35, 24);
    const neck = new THREE.Mesh(neckGeometry, skinMaterial);
    neck.position.y = 0.02;
    characterGroup.add(neck);

    // Head Group (Rotates and moves with head tracking)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.35, 0);
    characterGroup.add(headGroup);

    // Head / Face Mesh
    const headGeometry = new THREE.SphereGeometry(0.48, 32, 32);
    headGeometry.scale(1, 1.15, 0.96);
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.castShadow = true;
    headGroup.add(head);

    // Cheerful Cheeks (Blush)
    const blushGeom = new THREE.SphereGeometry(0.1, 16, 16);
    blushGeom.scale(1, 0.6, 0.4);
    const blushMaterial = new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: 0.45 });
    const leftBlush = new THREE.Mesh(blushGeom, blushMaterial);
    leftBlush.position.set(-0.28, -0.05, 0.42);
    headGroup.add(leftBlush);

    const rightBlush = leftBlush.clone();
    rightBlush.position.set(0.28, -0.05, 0.42);
    headGroup.add(rightBlush);

    // Nose
    const noseGeom = new THREE.ConeGeometry(0.065, 0.14, 16);
    const nose = new THREE.Mesh(noseGeom, skinMaterial);
    nose.position.set(0, 0, 0.48);
    nose.rotation.x = 0.3;
    headGroup.add(nose);

    // ----------------------------------------------------
    // 3D Eyes with Natural Blink and Gaze
    // ----------------------------------------------------
    const eyeGroup = new THREE.Group();
    headGroup.add(eyeGroup);

    const eyeBallGeom = new THREE.SphereGeometry(0.09, 20, 20);
    const irisGeom = new THREE.SphereGeometry(0.048, 16, 16);
    const pupilHighlightGeom = new THREE.SphereGeometry(0.015, 8, 8);
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Left Eye
    const leftEye = new THREE.Mesh(eyeBallGeom, eyeScleraMaterial);
    leftEye.position.set(-0.17, 0.08, 0.42);
    const leftIris = new THREE.Mesh(irisGeom, eyeIrisMaterial);
    leftIris.position.set(0, 0, 0.065);
    const leftHighlight = new THREE.Mesh(pupilHighlightGeom, highlightMat);
    leftHighlight.position.set(0.018, 0.02, 0.085);
    leftEye.add(leftIris);
    leftEye.add(leftHighlight);
    eyeGroup.add(leftEye);

    // Right Eye
    const rightEye = new THREE.Mesh(eyeBallGeom, eyeScleraMaterial);
    rightEye.position.set(0.17, 0.08, 0.42);
    const rightIris = new THREE.Mesh(irisGeom, eyeIrisMaterial);
    rightIris.position.set(0, 0, 0.065);
    const rightHighlight = new THREE.Mesh(pupilHighlightGeom, highlightMat);
    rightHighlight.position.set(0.018, 0.02, 0.085);
    rightEye.add(rightIris);
    rightEye.add(rightHighlight);
    eyeGroup.add(rightEye);

    // Eyelids (for realistic blinking)
    const eyelidGeom = new THREE.SphereGeometry(0.098, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const leftEyelid = new THREE.Mesh(eyelidGeom, skinMaterial);
    leftEyelid.position.set(-0.17, 0.08, 0.42);
    leftEyelid.rotation.x = -Math.PI * 0.45; // Open
    eyeGroup.add(leftEyelid);

    const rightEyelid = new THREE.Mesh(eyelidGeom, skinMaterial);
    rightEyelid.position.set(0.17, 0.08, 0.42);
    rightEyelid.rotation.x = -Math.PI * 0.45; // Open
    eyeGroup.add(rightEyelid);

    // Eyebrows
    const eyebrowGeom = new THREE.BoxGeometry(0.15, 0.028, 0.04);
    const leftEyebrow = new THREE.Mesh(eyebrowGeom, hairMaterial);
    leftEyebrow.position.set(-0.18, 0.22, 0.44);
    leftEyebrow.rotation.z = 0.08;
    headGroup.add(leftEyebrow);

    const rightEyebrow = new THREE.Mesh(eyebrowGeom, hairMaterial);
    rightEyebrow.position.set(0.18, 0.22, 0.44);
    rightEyebrow.rotation.z = -0.08;
    headGroup.add(rightEyebrow);

    // ----------------------------------------------------
    // 3D Mouth (Animated Morph for Speaking Lip-Sync)
    // ----------------------------------------------------
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.18, 0.45);
    headGroup.add(mouthGroup);

    // Lip Base / Smile
    const lipGeom = new THREE.TorusGeometry(0.11, 0.022, 12, 24, Math.PI);
    const mouthMesh = new THREE.Mesh(lipGeom, lipMaterial);
    mouthMesh.rotation.x = Math.PI * 0.05;
    mouthGroup.add(mouthMesh);

    // Interior Mouth cavity (opens dynamically during speaking)
    const mouthCavityGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);
    mouthCavityGeom.scale(1, 0.5, 0.3);
    const mouthCavity = new THREE.Mesh(mouthCavityGeom, mouthInteriorMaterial);
    mouthCavity.position.set(0, -0.02, -0.02);
    mouthCavity.visible = false;
    mouthGroup.add(mouthCavity);

    // ----------------------------------------------------
    // 3D Professional Nurse Hair & Cap
    // ----------------------------------------------------
    const hairTopGeom = new THREE.SphereGeometry(0.53, 24, 24);
    hairTopGeom.scale(1, 0.9, 1.05);
    const hairTop = new THREE.Mesh(hairTopGeom, hairMaterial);
    hairTop.position.set(0, 0.15, -0.05);
    headGroup.add(hairTop);

    // Side Hair Strands Framing Face
    const sideHairGeom = new THREE.CylinderGeometry(0.1, 0.14, 0.55, 16);
    const leftSideHair = new THREE.Mesh(sideHairGeom, hairMaterial);
    leftSideHair.position.set(-0.46, -0.08, 0.12);
    leftSideHair.rotation.z = 0.2;
    headGroup.add(leftSideHair);

    const rightSideHair = new THREE.Mesh(sideHairGeom, hairMaterial);
    rightSideHair.position.set(0.46, -0.08, 0.12);
    rightSideHair.rotation.z = -0.2;
    headGroup.add(rightSideHair);

    // 3D Nurse Cap
    const capGroup = new THREE.Group();
    capGroup.position.set(0, 0.48, 0.05);
    capGroup.rotation.x = -0.15;
    headGroup.add(capGroup);

    const capBaseGeom = new THREE.CylinderGeometry(0.38, 0.44, 0.22, 24, 1, false, 0, Math.PI);
    const nurseCap = new THREE.Mesh(capBaseGeom, whiteUniformMaterial);
    nurseCap.rotation.y = Math.PI / 2;
    capGroup.add(nurseCap);

    // Red Cross on Nurse Cap
    const crossVGeom = new THREE.BoxGeometry(0.045, 0.14, 0.02);
    const crossV = new THREE.Mesh(crossVGeom, redCrossMaterial);
    crossV.position.set(0, 0.02, 0.42);
    capGroup.add(crossV);

    const crossHGeom = new THREE.BoxGeometry(0.14, 0.045, 0.02);
    const crossH = new THREE.Mesh(crossHGeom, redCrossMaterial);
    crossH.position.set(0, 0.02, 0.42);
    capGroup.add(crossH);

    // ----------------------------------------------------
    // Halo Aura Ring (Reactive to State)
    // ----------------------------------------------------
    const haloGeom = new THREE.RingGeometry(0.85, 0.92, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const halo = new THREE.Mesh(haloGeom, haloMaterial);
    halo.position.set(0, 0.3, -0.5);
    scene.add(halo);

    // ----------------------------------------------------
    // Mouse Interaction / Gaze Tracking
    // ----------------------------------------------------
    const targetRotation = { x: 0, y: 0 };
    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotation.y = x * 0.35;
      targetRotation.x = -y * 0.25;
    };

    window.addEventListener('mousemove', onPointerMove);

    // ----------------------------------------------------
    // Animation Loop
    // ----------------------------------------------------
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let blinkTimer = 0;
    let isBlinking = false;
    let blinkProgress = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      const currentState = stateRef.current;
      const isSpeaking = currentState === 'speaking' || isAudioPlayingRef.current;

      // 1. Organic Breathing Idle Motion
      const breath = Math.sin(elapsed * 2.2) * 0.025;
      torso.position.y = -0.7 + breath * 0.5;
      headGroup.position.y = 0.35 + breath;

      // 2. Smooth Head Tracking & Idle Sway
      headGroup.rotation.y += (targetRotation.y - headGroup.rotation.y) * 0.08;
      headGroup.rotation.x += (targetRotation.x - headGroup.rotation.x) * 0.08;

      if (currentState === 'listening') {
        headGroup.rotation.z = Math.sin(elapsed * 2.0) * 0.04 + 0.05; // Attentive tilt
        haloMaterial.color.setHex(0xf59e0b); // Amber Listening Aura
        haloMaterial.opacity = 0.5 + Math.sin(elapsed * 6) * 0.25;
        halo.scale.setScalar(1.05 + Math.sin(elapsed * 4) * 0.05);
      } else if (currentState === 'thinking') {
        headGroup.rotation.z = -0.06;
        headGroup.rotation.x = -0.12 + Math.sin(elapsed * 3) * 0.03;
        haloMaterial.color.setHex(0xa855f7); // Purple Thinking Aura
        haloMaterial.opacity = 0.45;
        halo.rotation.z += 0.02;
      } else if (isSpeaking) {
        // Active speaking gesture
        headGroup.rotation.x += Math.sin(elapsed * 8.5) * 0.03;
        headGroup.rotation.y += Math.sin(elapsed * 4.2) * 0.03;
        haloMaterial.color.setHex(0x0d9488); // Teal Speaking Aura
        haloMaterial.opacity = 0.65 + Math.sin(elapsed * 8) * 0.2;
        halo.scale.setScalar(1.08 + Math.sin(elapsed * 6) * 0.06);
      } else {
        headGroup.rotation.z = Math.sin(elapsed * 1.2) * 0.015;
        haloMaterial.color.setHex(0x10b981); // Emerald Online Aura
        haloMaterial.opacity = 0.3 + Math.sin(elapsed * 2) * 0.1;
        halo.scale.setScalar(1.0);
      }

      // 3. Speaking Mouth Lip-Sync Animation (opens & morphs dynamically)
      if (isSpeaking) {
        const mouthOpen = Math.abs(Math.sin(elapsed * 14)) * 0.65 + Math.sin(elapsed * 9) * 0.35;
        mouthGroup.scale.set(1.1 + Math.sin(elapsed * 11) * 0.15, Math.max(0.4, mouthOpen * 1.8), 1);
        mouthCavity.visible = mouthOpen > 0.35;
      } else {
        mouthGroup.scale.set(1, 1, 1);
        mouthCavity.visible = false;
      }

      // 4. Natural Eye Blinking Logic
      blinkTimer += delta;
      if (!isBlinking && blinkTimer > 3.2 + Math.random() * 2.5) {
        isBlinking = true;
        blinkTimer = 0;
        blinkProgress = 0;
      }

      if (isBlinking) {
        blinkProgress += delta * 14;
        if (blinkProgress <= 1) {
          const closeAngle = -Math.PI * 0.45 + blinkProgress * (Math.PI * 0.45);
          leftEyelid.rotation.x = closeAngle;
          rightEyelid.rotation.x = closeAngle;
        } else if (blinkProgress <= 2) {
          const openAngle = 0 - (blinkProgress - 1) * (Math.PI * 0.45);
          leftEyelid.rotation.x = openAngle;
          rightEyelid.rotation.x = openAngle;
        } else {
          isBlinking = false;
          leftEyelid.rotation.x = -Math.PI * 0.45;
          rightEyelid.rotation.x = -Math.PI * 0.45;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 240;
      const newHeight = container.clientHeight || 280;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div className="relative w-48 h-56 sm:w-56 sm:h-64 flex flex-col items-center justify-center select-none mx-auto">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative z-10 flex items-center justify-center cursor-grab active:cursor-grabbing"
      />

      {/* Floating State Badge */}
      <div className="absolute -bottom-2 px-3 py-1 rounded-full text-[11px] font-bold shadow-md uppercase tracking-wider backdrop-blur-md border z-20 flex items-center space-x-1.5 transition-all">
        <span
          className={`w-2 h-2 rounded-full ${
            state === 'listening'
              ? 'bg-amber-500 animate-ping'
              : state === 'thinking'
              ? 'bg-purple-500 animate-spin'
              : state === 'speaking' || isAudioPlaying
              ? 'bg-teal-500 animate-bounce'
              : 'bg-emerald-500'
          }`}
        />
        <span
          className={
            state === 'listening'
              ? 'text-amber-800 bg-amber-100/90 border-amber-300'
              : state === 'thinking'
              ? 'text-purple-800 bg-purple-100/90 border-purple-300'
              : state === 'speaking' || isAudioPlaying
              ? 'text-teal-800 bg-teal-100/90 border-teal-300'
              : 'text-emerald-800 bg-emerald-100/90 border-emerald-300'
          }
        >
          {state === 'listening'
            ? 'Listening (கேட்கிறது)...'
            : state === 'thinking'
            ? 'Analyzing...'
            : state === 'speaking' || isAudioPlaying
            ? 'Speaking (பேசுகிறது)...'
            : '3D AI Nurse Active'}
        </span>
      </div>
    </div>
  );
};
