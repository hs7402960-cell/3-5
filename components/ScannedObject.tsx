
import React, { useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PointMaterial, Cylinder, Box } from '@react-three/drei';

interface ScannedObjectProps {
  isScanning: boolean;
  cameraMatrix: THREE.Matrix4;
  cameraPos: THREE.Vector3;
  cameraDir: THREE.Vector3;
}

// SCALE FACTOR (Increased to 1.3 for maximum visibility)
const SC = 1.3;

// Geometric Lion Construction Data
const LION_PARTS = [
  // Body (Main block)
  { type: 'box', args: [0.8*SC, 0.9*SC, 1.6*SC], pos: [0, 0.8*SC, 0], rot: [0, 0, 0] },
  // Head
  { type: 'box', args: [0.9*SC, 0.9*SC, 1.0*SC], pos: [0, 1.4*SC, 1.1*SC], rot: [0, 0, 0] },
  // Snout
  { type: 'box', args: [0.5*SC, 0.4*SC, 0.4*SC], pos: [0, 1.3*SC, 1.7*SC], rot: [0, 0, 0] },
  // Mane (Approximate with boxes)
  { type: 'box', args: [1.1*SC, 1.1*SC, 0.6*SC], pos: [0, 1.4*SC, 0.8*SC], rot: [0.1, 0, 0] },
  // Front Legs
  { type: 'box', args: [0.25*SC, 1.2*SC, 0.3*SC], pos: [-0.3*SC, 0.6*SC, 1.1*SC], rot: [0, 0, 0] },
  { type: 'box', args: [0.25*SC, 1.2*SC, 0.3*SC], pos: [0.3*SC, 0.6*SC, 1.1*SC], rot: [0, 0, 0] },
  // Back Legs
  { type: 'box', args: [0.3*SC, 1.0*SC, 0.4*SC], pos: [-0.35*SC, 0.5*SC, -0.6*SC], rot: [-0.2, 0, 0] },
  { type: 'box', args: [0.3*SC, 1.0*SC, 0.4*SC], pos: [0.35*SC, 0.5*SC, -0.6*SC], rot: [-0.2, 0, 0] },
  // Tail
  { type: 'cylinder', args: [0.05*SC, 0.05*SC, 1.0*SC], pos: [0, 0.8*SC, -1.0*SC], rot: [Math.PI/3, 0, 0] }
];

export const ScannedObject: React.FC<ScannedObjectProps> = ({ 
  isScanning, 
  cameraPos, 
  cameraDir 
}) => {
  const [scannedIndices, setScannedIndices] = useState<Set<number>>(new Set());

  // Helper to generate points on surface of a Box
  const getBoxPoints = (width: number, height: number, depth: number, density: number) => {
    const pts = [];
    const nrms = [];
    // Increase density logic adjusted for scale
    const area = 2*(width*height + width*depth + height*depth);
    const count = Math.ceil(area * density * 4); // Adjusted density for performance
    
    for(let i=0; i<count; i++) {
        // Pick a face
        const face = Math.floor(Math.random() * 6);
        const u = Math.random() - 0.5;
        const v = Math.random() - 0.5;
        let p = new THREE.Vector3();
        let n = new THREE.Vector3();

        if (face === 0) { p.set(width/2, u*height, v*depth); n.set(1,0,0); }
        else if (face === 1) { p.set(-width/2, u*height, v*depth); n.set(-1,0,0); }
        else if (face === 2) { p.set(u*width, height/2, v*depth); n.set(0,1,0); }
        else if (face === 3) { p.set(u*width, -height/2, v*depth); n.set(0,-1,0); }
        else if (face === 4) { p.set(u*width, v*height, depth/2); n.set(0,0,1); }
        else { p.set(u*width, v*height, -depth/2); n.set(0,0,-1); }
        
        pts.push(p);
        nrms.push(n);
    }
    return { pts, nrms };
  };

  const { points, normals } = useMemo(() => {
    let allPoints: THREE.Vector3[] = [];
    let allNorms: THREE.Vector3[] = [];
    
    // Platform offset
    const platformY = 1.3; // Table height

    LION_PARTS.forEach(part => {
        let p: THREE.Vector3[] = [];
        let n: THREE.Vector3[] = [];
        
        if (part.type === 'box') {
            const data = getBoxPoints(part.args[0] as number, part.args[1] as number, part.args[2] as number, 5000);
            p = data.pts;
            n = data.nrms;
        } else if (part.type === 'cylinder') {
             for(let k=0; k<300; k++) {
                 const theta = Math.random() * Math.PI * 2;
                 const h = (Math.random() - 0.5) * (part.args[2] as number);
                 const r = part.args[0] as number;
                 p.push(new THREE.Vector3(Math.cos(theta)*r, h, Math.sin(theta)*r));
                 n.push(new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)));
             }
        }

        // Transform points to world space
        const pos = new THREE.Vector3(...(part.pos as [number,number,number]));
        pos.y += platformY; // Place ON the table
        const rot = new THREE.Euler(...(part.rot as [number,number,number]));
        const quat = new THREE.Quaternion().setFromEuler(rot);

        p.forEach((pt, i) => {
            pt.applyQuaternion(quat);
            pt.add(pos);
            allPoints.push(pt);
            
            const norm = n[i].clone();
            norm.applyQuaternion(quat);
            allNorms.push(norm);
        });
    });

    return { points: allPoints, normals: allNorms };
  }, []);

  useFrame(() => {
    if (!isScanning) return;

    // INCREASED FOV to 75 degrees match visual pyramid
    const fov = 75 * (Math.PI / 180);
    
    // UPDATED Max Scan Distance to 2.3 to match visual frustum (2.25)
    const maxDist = 2.3; 
    
    const newIndices = new Set(scannedIndices);
    let changed = false;

    // Use a spatial subset or stride to improve performance
    const stride = 1; 

    for (let i = 0; i < points.length; i += stride) { 
      if (newIndices.has(i)) continue;

      const pt = points[i];
      const toPoint = pt.clone().sub(cameraPos);
      const dist = toPoint.length();

      // Ensure we are close enough but not clipping inside camera
      if (dist < maxDist && dist > 0.1) { 
        // 1. Check if point is inside camera cone
        const angle = toPoint.clone().normalize().angleTo(cameraDir);
        if (angle < fov / 2) {
            // 2. Check if point normal faces camera (Backface culling)
            const viewVec = cameraPos.clone().sub(pt).normalize();
            if (viewVec.dot(normals[i]) > 0.0) { 
                newIndices.add(i);
                changed = true;
            }
        }
      }
    }

    if (changed) {
      setScannedIndices(newIndices);
    }
  });

  const scannedPositions = useMemo(() => {
    const arr = new Float32Array(scannedIndices.size * 3);
    let i = 0;
    scannedIndices.forEach(idx => {
      arr[i++] = points[idx].x;
      arr[i++] = points[idx].y;
      arr[i++] = points[idx].z;
    });
    return arr;
  }, [scannedIndices, points]);

  return (
    <group>
      {/* --- INSPECTION TABLE --- */}
      <group position={[0, 0, 0]}>
        {/* Granite Slab - Enlarged to 8x6 */}
        <Box args={[8, 0.5, 6]} position={[0, 1.1, 0]}>
           <meshStandardMaterial color="#1a202c" roughness={0.2} metalness={0.4} />
        </Box>
        {/* Heavy Legs - Repositioned for larger table */}
        <Cylinder args={[0.2, 0.2, 1.0]} position={[-3.5, 0.5, 2.5]}>
            <meshStandardMaterial color="#2d3748" />
        </Cylinder>
        <Cylinder args={[0.2, 0.2, 1.0]} position={[3.5, 0.5, 2.5]}>
            <meshStandardMaterial color="#2d3748" />
        </Cylinder>
        <Cylinder args={[0.2, 0.2, 1.0]} position={[-3.5, 0.5, -2.5]}>
            <meshStandardMaterial color="#2d3748" />
        </Cylinder>
        <Cylinder args={[0.2, 0.2, 1.0]} position={[3.5, 0.5, -2.5]}>
            <meshStandardMaterial color="#2d3748" />
        </Cylinder>
      </group>

      {/* --- GEOMETRIC LION MODEL (Visual) --- */}
      <group position={[0, 1.3, 0]}>
         {LION_PARTS.map((part, i) => {
             if (part.type === 'box') {
                 return (
                     <Box key={i} args={part.args as any} position={part.pos as any} rotation={part.rot as any}>
                         <meshStandardMaterial color="#d69e2e" roughness={0.6} metalness={0.1} />
                     </Box>
                 )
             } else {
                 return (
                     <Cylinder key={i} args={part.args as any} position={part.pos as any} rotation={part.rot as any}>
                         <meshStandardMaterial color="#d69e2e" roughness={0.6} metalness={0.1} />
                     </Cylinder>
                 )
             }
         })}
      </group>

      {/* --- POINT CLOUD --- */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={scannedPositions.length / 3}
            array={scannedPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <PointMaterial
          transparent
          vertexColors={false}
          color="#FFD700" /* GOLD Color */
          size={0.02} // Larger points
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.8}
        />
      </points>
    </group>
  );
};
