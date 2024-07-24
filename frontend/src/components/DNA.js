import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

const DNAStrand = () => {
  const strandRef = useRef();

  useFrame(({ clock }) => {
    if (strandRef.current) {
      strandRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });

  const dnaStrand = useMemo(() => {
    const strand = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -15, 0),
      new THREE.Vector3(10, -7.5, 10),
      new THREE.Vector3(-10, 0, -10),
      new THREE.Vector3(10, 7.5, 10),
      new THREE.Vector3(0, 15, 0),
    ]);

    const tubeGeometry = new THREE.TubeGeometry(curve, 200, 1.5, 32, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x3f51b5,
      metalness: 0.8,
      roughness: 0.2,
      envMapIntensity: 1
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    strand.add(tubeMesh);

    const sphereGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const sphere1Material = new THREE.MeshStandardMaterial({
      color: 0xff5722,
      metalness: 0.8,
      roughness: 0.2,
      envMapIntensity: 1
    });
    const sphere2Material = new THREE.MeshStandardMaterial({
      color: 0x4caf50,
      metalness: 0.8,
      roughness: 0.2,
      envMapIntensity: 1
    });

    for (let i = 0; i <= 100; i += 5) {
      const t = i / 100;
      const position = curve.getPoint(t);
      const tangent = curve.getTangent(t);

      const sphereMesh1 = new THREE.Mesh(sphereGeometry, sphere1Material);
      sphereMesh1.position.copy(position).addScaledVector(tangent.cross(new THREE.Vector3(0, 1, 0)).normalize(), 3);
      strand.add(sphereMesh1);

      const sphereMesh2 = new THREE.Mesh(sphereGeometry, sphere2Material);
      sphereMesh2.position.copy(position).addScaledVector(tangent.cross(new THREE.Vector3(0, 1, 0)).normalize(), -3);
      strand.add(sphereMesh2);

      const connectorGeometry = new THREE.CylinderGeometry(0.5, 0.5, 6, 32);
      const connectorMaterial = new THREE.MeshStandardMaterial({
        color: 0xffeb3b,
        metalness: 0.8,
        roughness: 0.2,
        envMapIntensity: 1
      });
      const connectorMesh = new THREE.Mesh(connectorGeometry, connectorMaterial);
      connectorMesh.position.copy(position);
      connectorMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent.cross(new THREE.Vector3(0, 1, 0)).normalize());
      strand.add(connectorMesh);
    }

    return strand;
  }, []);

  return <primitive object={dnaStrand} ref={strandRef} />;
};

const DNA = () => {
  return (
    <Canvas style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <PerspectiveCamera makeDefault position={[0, 0, 40]} fov={40} />
      <color attach="background" args={['#050505']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      <OrbitControls enableZoom={true} autoRotate autoRotateSpeed={0.5} />
      <DNAStrand />
      <Environment preset="warehouse" />
    </Canvas>
  );
};

export default DNA;