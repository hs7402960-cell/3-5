
import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

import { MachineModel } from './components/MachineModel';
import { ScannedObject } from './components/ScannedObject';
import { ControlPanel } from './components/ControlPanel';
import { Axes } from './types';

const App: React.FC = () => {
  // State
  // Z=0 is Retracted (High), Z=100 is Extended (Low).
  const [axes, setAxes] = useState<Axes>({ x: 50, y: 50, z: 10, a: 0, b: 0 });
  const [isScanning, setIsScanning] = useState(false);
  
  // Camera Tracking for Scanning Logic
  const cameraMatrixRef = useRef<THREE.Matrix4>(new THREE.Matrix4());
  const cameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const cameraDirRef = useRef<THREE.Vector3>(new THREE.Vector3());
  
  // Demo Animation State
  const demoRequestRef = useRef<number | null>(null);

  const updateCameraState = (matrix: THREE.Matrix4, pos: THREE.Vector3, dir: THREE.Vector3) => {
    cameraMatrixRef.current.copy(matrix);
    cameraPosRef.current.copy(pos);
    cameraDirRef.current.copy(dir);
  };

  const startDemoTrajectory = () => {
    setIsScanning(true);
    const startTime = Date.now();
    
    const DURATION = 25; // Seconds
    
    // ORBIT PARAMETERS for ~45 Degree Tilt
    // Machine Coordinates: Center (50, 50).
    // Lion Top is ~3.7m. Head at Z=50 is ~4.75m. Diff ~1.0m above top, ~3.4m above center.
    // To maintain 45 degrees, Radius should be roughly equal to Height Diff (~60 units).
    // Z_SCAN reduced to 50 (Higher up) to avoid collision with Lion Head.
    const RAD_X = 60; 
    const RAD_Y = 75; // Elongated Y to capture TAIL (-Z world)
    const Z_SCAN = 50; 

    // START POSITION (Front/Side of Lion)
    // We want a clean loop: Approach -> Orbit -> Return
    
    const animate = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      
      if (elapsed > DURATION) {
        setIsScanning(false);
        setAxes(prev => ({ ...prev, a: 0, b: 0, z: 20 }));
        return;
      }

      const cx = 50;
      const cy = 50;
      
      // Calculate Phase
      // 0-2s: Approach
      // 2s-22s: Orbit (360)
      // 22s-25s: Return
      
      let tx = 50, ty = 50, tz = 10;
      
      if (elapsed < 2) {
          // Approach Phase
          const t = elapsed / 2;
          // Interpolate Home -> Start of Orbit (theta = PI)
          // Start of Orbit: x = cx + Rx*cos(PI) = cx - Rx. y = cy.
          const startX = cx - RAD_X;
          const startY = cy;
          
          tx = 50 + (startX - 50) * t;
          ty = 50 + (startY - 50) * t;
          tz = 10 + (Z_SCAN - 10) * t;
      } else if (elapsed < 22) {
          // Orbit Phase
          const orbitTime = elapsed - 2;
          const orbitDur = 20;
          const progress = orbitTime / orbitDur;
          
          // Full 360 circle: PI -> 3PI
          const theta = Math.PI + (progress * Math.PI * 2);
          
          tx = cx + RAD_X * Math.cos(theta);
          ty = cy + RAD_Y * Math.sin(theta);
          tz = Z_SCAN;
      } else {
          // Return Phase
          const retTime = elapsed - 22;
          const retDur = 3;
          const t = retTime / retDur;
          
          // End of Orbit (theta = 3PI == PI) -> x = cx-Rx, y=cy.
          const endX = cx - RAD_X;
          const endY = cy;
          
          tx = endX + (50 - endX) * t;
          ty = endY + (50 - endY) * t;
          tz = Z_SCAN + (10 - Z_SCAN) * t;
      }

      // LOOK AT LOGIC (Inverse Kinematics)
      const worldX = (tx - 50) / 100 * 6;
      const worldZ = (ty - 50) / 100 * 6;
      const toolY = 5.8 - (tz / 100 * 2.5); // Approx height
      
      const toolPos = new THREE.Vector3(worldX, toolY, worldZ);
      const target = new THREE.Vector3(0, 1.3, 0); // Lion Center
      
      const dir = target.clone().sub(toolPos).normalize();
      
      // Calculate Angles
      // A (Tilt X): -asin(dir.z) - tilts forward/back
      // B (Rot Z): atan2(dir.x, -dir.y) - rotates sideways
      
      const angleA_rad = -Math.asin(dir.z);
      const angleB_rad = Math.atan2(dir.x, -dir.y);
      
      setAxes({ 
          x: tx, 
          y: ty, 
          z: tz, 
          a: THREE.MathUtils.radToDeg(angleA_rad), 
          b: THREE.MathUtils.radToDeg(angleB_rad) 
      });
      
      demoRequestRef.current = requestAnimationFrame(animate);
    };
    demoRequestRef.current = requestAnimationFrame(animate);
  };

  const resetScan = () => {
     setIsScanning(false);
     setAxes({ x: 50, y: 50, z: 10, a: 0, b: 0 });
     window.location.reload(); 
  };

  useEffect(() => {
    return () => {
      if (demoRequestRef.current !== null) cancelAnimationFrame(demoRequestRef.current);
    };
  }, []);

  return (
    <div className="w-full h-screen flex bg-gray-950 relative">
      {/* Left Overlay Controls */}
      <div className="absolute left-4 top-4 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <ControlPanel 
            axes={axes} 
            setAxes={setAxes} 
            isScanning={isScanning}
            setIsScanning={setIsScanning}
            resetScan={resetScan}
            startDemo={startDemoTrajectory}
          />
        </div>
        
        <div className="mt-4 bg-gray-900/90 p-4 rounded-xl text-xs text-gray-400 max-w-sm border border-gray-700 backdrop-blur-sm shadow-2xl">
           <h4 className="font-bold text-gray-200 mb-2 border-b border-gray-700 pb-2">Status</h4>
           <div className="grid grid-cols-2 gap-2">
             <span>Z-Head: <span className={axes.z > 70 ? "text-red-500 font-bold" : "text-green-500"}>{axes.z > 70 ? "COLLISION RISK" : "SAFE"}</span></span>
             <span>Mode: {isScanning ? "AUTO-SCAN" : "MANUAL"}</span>
             <span>B-Axis: {axes.b.toFixed(1)}°</span>
             <span>A-Axis: {axes.a.toFixed(1)}°</span>
           </div>
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="flex-1 h-full">
        <Canvas shadows camera={{ position: [8, 8, 8], fov: 45 }}>
          <color attach="background" args={['#0f1115']} />
          <fog attach="fog" args={['#0f1115', 10, 60]} />
          
          <ambientLight intensity={0.4} />
          <pointLight position={[-10, 10, -10]} intensity={0.5} />
          <spotLight 
            position={[5, 12, 5]} 
            angle={0.6} 
            penumbra={0.5} 
            intensity={1.2} 
            castShadow 
            shadow-bias={-0.0001}
          />
          <Environment preset="city" />

          <Grid 
            infiniteGrid 
            sectionColor="#333" 
            cellColor="#1a1a1a" 
            fadeDistance={50} 
            position={[0, -0.01, 0]}
          />
          
          <group position={[0, 0, 0]}>
            <MachineModel axes={axes} onCameraUpdate={updateCameraState} />
            <ScannedObject 
              isScanning={isScanning} 
              cameraMatrix={cameraMatrixRef.current} 
              cameraPos={cameraPosRef.current}
              cameraDir={cameraDirRef.current}
            />
          </group>
          
          <ContactShadows opacity={0.5} scale={30} blur={2.5} far={4} resolution={256} color="#000000" />

          <OrbitControls 
            makeDefault 
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2 - 0.05} 
            minDistance={2}
            maxDistance={30}
            target={[0, 1.3, 0]}
          />
        </Canvas>
      </div>
    </div>
  );
};

export default App;
