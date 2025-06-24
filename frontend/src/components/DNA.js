import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const DNAStrand = ({ position, rotation, speed, scale = 1 }) => {
  const strandRef = useRef();

  useFrame(({ clock }) => {
    if (strandRef.current) {
      strandRef.current.rotation.y = clock.getElapsedTime() * speed;
      strandRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    }
  });

  const dnaStrand = useMemo(() => {
    const strand = new THREE.Group();
    
    // Create a more complex DNA curve
    const points = [];
    const segments = 50;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 4; // 2 full rotations
      const radius = 2 + Math.sin(t * Math.PI * 8) * 0.5; // Varying radius
      const x = Math.cos(angle) * radius;
      const y = (t - 0.5) * 20; // Height
      const z = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    
    // Main DNA backbone
    const tubeGeometry = new THREE.TubeGeometry(curve, 100, 0.8, 16, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A90E2,
      transparent: true,
      opacity: 0.3,
      metalness: 0.1,
      roughness: 0.8,
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    strand.add(tubeMesh);

    // Base pairs (rungs of the ladder)
    const baseGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x7B68EE,
      transparent: true,
      opacity: 0.4,
      metalness: 0.2,
      roughness: 0.7,
    });

    for (let i = 0; i <= 40; i += 2) {
      const t = i / 40;
      const position = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      
      // Create base pair connector
      const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
      baseMesh.position.copy(position);
      
      // Orient the base pair perpendicular to the curve
      const up = new THREE.Vector3(0, 1, 0);
      const right = tangent.cross(up).normalize();
      baseMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), right);
      
      strand.add(baseMesh);
    }

    // Add some floating particles around the DNA
    const particleCount = 30;
    const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const particleMaterial = new THREE.MeshStandardMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.6,
    });

    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      const t = i / particleCount;
      const basePos = curve.getPoint(t);
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 8
      );
      particle.position.copy(basePos).add(offset);
      strand.add(particle);
    }

    return strand;
  }, []);

  return (
    <primitive 
      object={dnaStrand} 
      ref={strandRef} 
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
};

const DNABackground = () => {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  // Create multiple DNA strands for a richer background
  const dnaStrands = useMemo(() => {
    const strands = [];
    const count = 5;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 15 + Math.random() * 10;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 10;
      
      strands.push({
        position: [x, y, z],
        rotation: [0, Math.random() * Math.PI * 2, 0],
        speed: 0.1 + Math.random() * 0.2,
        scale: 0.8 + Math.random() * 0.4
      });
    }
    
    return strands;
  }, []);

  return (
    <group ref={groupRef}>
      {dnaStrands.map((strand, index) => (
        <DNAStrand
          key={index}
          position={strand.position}
          rotation={strand.rotation}
          speed={strand.speed}
          scale={strand.scale}
        />
      ))}
    </group>
  );
};

const DNA = () => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      zIndex: -1,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 50]} fov={60} />
        
        {/* Subtle background color */}
        <color attach="background" args={['transparent']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.6} />
        <pointLight position={[0, 0, 20]} intensity={0.3} color="#4A90E2" />
        <pointLight position={[0, 0, -20]} intensity={0.3} color="#7B68EE" />
        
        <DNABackground />
      </Canvas>
    </div>
  );
};

export default DNA;