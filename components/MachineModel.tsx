
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, PerspectiveCamera, RoundedBox, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { Axes } from '../types';

interface MachineModelProps {
  axes: Axes;
  onCameraUpdate: (matrix: THREE.Matrix4, position: THREE.Vector3, direction: THREE.Vector3) => void;
}

// Helper for mechanical parts
const MechanicalPart: React.FC<{ color?: string; args: any; position?: any; rotation?: any; children?: React.ReactNode }> = ({ color = "#a0aec0", args, position, rotation, children }) => (
  <group position={position} rotation={rotation}>
    <RoundedBox args={args} radius={0.02} smoothness={4}>
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
    </RoundedBox>
    {children}
  </group>
);

export const MachineModel: React.FC<MachineModelProps> = ({ axes, onCameraUpdate }) => {
  // Kinematic chain refs
  const bridgeRef = useRef<THREE.Group>(null); // Y-axis
  const carriageRef = useRef<THREE.Group>(null); // X-axis
  const zRamRef = useRef<THREE.Group>(null); // Z-axis
  const bAxisRef = useRef<THREE.Group>(null); // B-axis (Rotation around Machine Y / ThreeJS Z)
  const aAxisRef = useRef<THREE.Group>(null); // A-axis (Tilt around Machine X / ThreeJS X)
  const camRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame(() => {
    // 1. Y Axis: Bridge movement (Front/Back)
    if (bridgeRef.current) {
      bridgeRef.current.position.z = (axes.y - 50) / 100 * 6;
    }

    // 2. X Axis: Carriage movement (Left/Right)
    if (carriageRef.current) {
      carriageRef.current.position.x = (axes.x - 50) / 100 * 6;
    }

    // 3. Z Axis: Ram movement (Up/Down)
    if (zRamRef.current) {
      const extension = (axes.z / 100) * 2.5;
      zRamRef.current.position.y = -extension;
    }

    // 4. B Axis: Rotation around Machine Y (ThreeJS Z)
    if (bAxisRef.current) {
      bAxisRef.current.rotation.z = THREE.MathUtils.degToRad(axes.b);
    }

    // 5. A Axis: Tilt around Machine X (ThreeJS X)
    if (aAxisRef.current) {
      aAxisRef.current.rotation.x = THREE.MathUtils.degToRad(axes.a);
    }

    // Camera Update
    if (camRef.current) {
       const worldMatrix = camRef.current.matrixWorld.clone();
       const worldPos = new THREE.Vector3();
       const worldDir = new THREE.Vector3();
       
       camRef.current.getWorldPosition(worldPos);
       camRef.current.getWorldDirection(worldDir);

       onCameraUpdate(worldMatrix, worldPos, worldDir);
    }
  });

  return (
    <group>
      {/* --- STATIONARY BASE --- */}
      <MechanicalPart args={[8, 0.8, 12]} position={[0, 0.4, 0]} color="#1a202c" />
      {/* Taller Legs for Clearance */}
      <MechanicalPart args={[0.4, 0.2, 12]} position={[-3.5, 0.9, 0]} color="#718096" />
      <MechanicalPart args={[0.4, 0.2, 12]} position={[3.5, 0.9, 0]} color="#718096" />

      {/* --- Y-AXIS: MOVING BRIDGE --- */}
      <group ref={bridgeRef}>
        {/* Legs - Made Taller */}
        <MechanicalPart args={[0.8, 9.0, 1.2]} position={[-3.5, 5.0, 0]} color="#2d3748">
           <Box args={[0.6, 8, 0.1]} position={[-0.41, 0, 0]}>
             <meshStandardMaterial color="#dd6b20" />
           </Box>
        </MechanicalPart>
        
        <MechanicalPart args={[0.8, 9.0, 1.2]} position={[3.5, 5.0, 0]} color="#2d3748" />
        
        {/* Crossbeam - Raised to Y=10.0 */}
        <MechanicalPart args={[8.5, 1.0, 1.5]} position={[0, 10.0, 0]} color="#4a5568" />

        {/* --- X-AXIS: CARRIAGE --- */}
        <group ref={carriageRef}>
             {/* Carriage Body - Raised */}
             <MechanicalPart args={[1.6, 1.2, 1.7]} position={[0, 10.0, 0.2]} color="#718096" />
             
             {/* --- Z-AXIS: VERTICAL RAM --- */}
             <group ref={zRamRef} position={[0, 0, 0]}> 
                {/* Ram Body - Raised */}
                <MechanicalPart args={[0.8, 5, 0.8]} position={[0, 10.0, 1.3]} color="#cbd5e0" />
                
                {/* --- 5-AXIS WRIST --- */}
                {/* Wrist Origin - Raised to 7.5 */}
                <group position={[0, 7.5, 1.3]}>
                   
                   {/* B-Axis Module (Rotates around Z / Machine Y) */}
                   <group ref={bAxisRef}>
                      {/* Visual: Horizontal Cylinder to indicate B-Axis (around Z) */}
                      <Cylinder args={[0.5, 0.5, 0.6]} rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0]}>
                        <meshStandardMaterial color="#2c5282" />
                      </Cylinder>
                      
                      {/* Fork / Hinge for A-Axis */}
                      <group position={[0, -0.6, 0]} ref={aAxisRef}>
                         <MechanicalPart args={[1.0, 0.6, 0.8]} position={[0, 0, 0]} color="#4a5568" />
                         
                         {/* --- LASER SCANNER HEAD (Needle Shape) --- */}
                         <group position={[0, -0.5, 0]}>
                            
                            {/* Main Housing (Top) */}
                            <group position={[0, -0.2, 0]}>
                               <Cylinder args={[0.35, 0.3, 0.5, 16]} position={[0, 0, 0]}>
                                  <meshStandardMaterial color="#171923" roughness={0.3} />
                               </Cylinder>
                               
                               {/* Status LED Ring */}
                               <Cylinder args={[0.36, 0.36, 0.05, 16]} position={[0, 0.15, 0]}>
                                   <meshStandardMaterial color="#48bb78" emissive="#48bb78" emissiveIntensity={0.5} />
                               </Cylinder>
                            </group>

                            {/* Needle / Tube Extension */}
                            <group position={[0, -0.8, 0]}>
                               <Cylinder args={[0.06, 0.08, 1.0, 16]} position={[0, 0, 0]}>
                                   <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
                               </Cylinder>
                            </group>

                            {/* Laser Emitter Tip */}
                            <group position={[0, -1.35, 0]}>
                               <Cylinder args={[0.02, 0.06, 0.15, 16]} position={[0, 0, 0]}>
                                   <meshStandardMaterial color="#718096" />
                               </Cylinder>
                               <Cylinder args={[0.005, 0.005, 0.1]} position={[0, -0.05, 0]}>
                                    <meshStandardMaterial color="#f00" emissive="#f00" emissiveIntensity={5} />
                               </Cylinder>
                            </group>

                            {/* External RGB-D Camera Module */}
                            <group position={[0.4, -0.6, 0]}>
                               {/* Bracket attaching to Needle/Housing */}
                               <Box args={[0.3, 0.1, 0.1]} position={[-0.2, 0.2, 0]}>
                                  <meshStandardMaterial color="#4a5568" />
                               </Box>
                               
                               {/* Camera Body */}
                               <Box args={[0.15, 0.3, 0.2]} position={[0, 0, 0]}>
                                  <meshStandardMaterial color="#a0aec0" />
                               </Box>
                               
                               {/* Lens Housing */}
                               <Cylinder args={[0.08, 0.08, 0.1]} rotation={[Math.PI/2, 0, 0]} position={[0, -0.1, 0]}>
                                  <meshStandardMaterial color="#222" />
                               </Cylinder>

                               {/* Virtual Camera Logic 
                                   Camera looks down -Z axis in its local frame.
                                   Rotation -90 X aligns local -Z with World -Y (Parent -Y, which is Down/Laser Direction).
                               */}
                               <PerspectiveCamera 
                                  ref={camRef} 
                                  makeDefault={false} 
                                  position={[0, -0.15, 0]} 
                                  rotation={[-Math.PI/2, 0, 0]} 
                                  fov={75} 
                                  near={0.1} 
                                  far={10} 
                               >
                                  {/* Visual Frustum (Cone) 
                                      We want it to point along the camera's viewing direction (-Z).
                                      Standard Cylinder is along Y. We rotate X 90 to align with Z.
                                      Dimensions: 
                                        Height/Working Distance = 2.25
                                        Radius ~ 1.7 (tan(37.5) * 2.25)
                                  */}
                                  <group rotation={[Math.PI/2, 0, 0]}>
                                      {/* Shifted so the Tip (0 radius) starts at the camera origin (0,0,0) */}
                                      <group position={[0, -1.125, 0]}>
                                          <mesh rotation={[0, Math.PI/4, 0]}>
                                              {/* CylinderGeometry(radiusTop, radiusBottom, height, ...) 
                                                  Top=0 (Tip), Bottom=1.7 (Base).
                                                  Default cylinder goes +Y to -Y. 
                                                  Rotated 90X -> +Z to -Z.
                                                  So it projects into the screen (Camera View).
                                              */}
                                              <cylinderGeometry args={[0, 1.7, 2.25, 4, 1, true]} />
                                              <meshBasicMaterial color="cyan" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
                                          </mesh>
                                          
                                          {/* Wireframe Edges */}
                                          <lineSegments rotation={[0, Math.PI/4, 0]}>
                                              <edgesGeometry args={[new THREE.CylinderGeometry(0, 1.7, 2.25, 4, 1, true)]} />
                                              <lineBasicMaterial color="cyan" opacity={0.6} transparent />
                                          </lineSegments>
                                      </group>
                                  </group>
                               </PerspectiveCamera>
                               
                            </group>
                            
                         </group>
                      </group>
                   </group>

                </group>
             </group>
        </group>
      </group>
    </group>
  );
};
