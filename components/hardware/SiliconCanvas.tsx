'use client'

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, PerspectiveCamera, OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useHardware } from '../../context/HardwareContext'

const Microchip = () => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const wireRef = useRef<THREE.Mesh>(null!)
  const { voltage, amperage, isAnomaly } = useHardware()

  // Rotation speed tied to voltage (normalized around 3.3V) - AGGRESSIVE on anomaly
  const baseRotationSpeed = useMemo(() => (voltage / 3.3) * 0.5, [voltage])
  const rotationSpeed = useMemo(() => (isAnomaly ? baseRotationSpeed * 3 : baseRotationSpeed), [baseRotationSpeed, isAnomaly])
  
  // Emissive intensity tied to amperage (normalized around 0.65A) - BOOSTED on anomaly
  const baseFlowIntensity = useMemo(() => (amperage / 0.65) * 2, [amperage])
  const flowIntensity = useMemo(() => (isAnomaly ? baseFlowIntensity * 4 : baseFlowIntensity), [baseFlowIntensity, isAnomaly])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    
    if (meshRef.current) {
      // Continuous rotation - aggressive on anomaly
      meshRef.current.rotation.y += (0.01 * rotationSpeed) * (isAnomaly ? 2 : 1)
      meshRef.current.rotation.z += (0.005 * rotationSpeed) * (isAnomaly ? 2 : 1)

      // Anomaly Jitter - MORE INTENSE
      if (isAnomaly) {
        meshRef.current.position.x = (Math.random() - 0.5) * 0.25
        meshRef.current.position.y = (Math.random() - 0.5) * 0.25
        meshRef.current.position.z = (Math.random() - 0.5) * 0.25
      } else {
        meshRef.current.position.set(0, 0, 0)
      }
    }

    if (wireRef.current) {
      // Breathing effect for wireframe - pulsing on anomaly
      const breath = isAnomaly 
        ? Math.sin(time * 3) * 0.3 + 0.7 // Faster pulse during anomaly
        : Math.sin(time * 1.5) * 0.3 + 0.7
      const material = wireRef.current.material as THREE.MeshBasicMaterial
      material.opacity = isAnomaly ? 1 : breath * 0.4
      
      // Wireframe rotation follows chip
      wireRef.current.rotation.y = meshRef.current.rotation.y
      wireRef.current.rotation.z = meshRef.current.rotation.z
    }
  })

  // Aggressive color change on anomaly: GREEN -> RED
  const glowColor = isAnomaly ? '#ff0000' : '#10b981'

  return (
    <group>
      {/* Main Chip Body */}
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[2, 0.2, 2]} />
        <meshStandardMaterial
          color={isAnomaly ? '#1a0000' : '#0a0a0a'}
          roughness={0.1}
          metalness={0.8}
          emissive={new THREE.Color(glowColor)}
          emissiveIntensity={isAnomaly ? 8 : flowIntensity}
        />
      </mesh>

      {/* Breathing Wireframe Overlay */}
      <mesh ref={wireRef}>
        <boxGeometry args={[2.05, 0.25, 2.05]} />
        <meshBasicMaterial
          color={glowColor}
          wireframe
          transparent
          opacity={isAnomaly ? 0.8 : 0.3}
        />
      </mesh>

      {/* Decorative "Pins" */}
      {[-0.8, -0.4, 0, 0.4, 0.8].map((x) => (
        <React.Fragment key={x}>
          <mesh position={[x, -0.15, 1.1]}>
             <boxGeometry args={[0.1, 0.05, 0.2]} />
             <meshStandardMaterial 
               color={isAnomaly ? '#330000' : '#333'} 
               metalness={1}
               emissive={new THREE.Color(isAnomaly ? '#ff3333' : '#000000')}
               emissiveIntensity={isAnomaly ? 3 : 0}
             />
          </mesh>
          <mesh position={[x, -0.15, -1.1]}>
             <boxGeometry args={[0.1, 0.05, 0.2]} />
             <meshStandardMaterial 
               color={isAnomaly ? '#330000' : '#333'} 
               metalness={1}
               emissive={new THREE.Color(isAnomaly ? '#ff3333' : '#000000')}
               emissiveIntensity={isAnomaly ? 3 : 0}
             />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  )
}

const SiliconCanvas = React.memo(() => {
  return (
    <div className="h-full w-full min-h-[300px] relative">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 4, 6]} fov={35} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        
        <ambientLight intensity={0.2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#10b981" />
        
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <Microchip />
        </Float>

        <Environment preset="night" />
      </Canvas>
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500/50 animate-pulse" style={{ width: '40%' }} />
          </div>
          <p className="text-[10px] font-mono text-emerald-500/50 uppercase tracking-tighter">Silicon Core v4.0</p>
        </div>
      </div>
    </div>
  )
})

export default SiliconCanvas
