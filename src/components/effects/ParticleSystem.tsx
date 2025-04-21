import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface ParticleSystemProps {
  count?: number;
  color?: string;
  size?: number;
  spread?: number;
  lifetime?: number;
  position?: [number, number, number];
}

export function ParticleSystem({
  count = 100,
  color = '#ffffff',
  size = 0.1,
  spread = 2,
  lifetime = 2,
  position = [0, 0, 0],
}: ParticleSystemProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array>();
  const lifetimesRef = useRef<Float32Array>();

  useEffect(() => {
    // Initialize particle system
    if (!particlesRef.current) return;

    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random initial positions within spread
      positions[i * 3] = position[0] + (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = position[1] + (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = position[2] + (Math.random() - 0.5) * spread;

      // Random velocities
      velocities[i * 3] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 1] = Math.random() * 4; // Upward bias
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;

      // Random lifetimes
      lifetimes[i] = Math.random() * lifetime;
    }

    particlesRef.current.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    velocitiesRef.current = velocities;
    lifetimesRef.current = lifetimes;
  }, [count, spread, position, lifetime]);

  useFrame((state, delta) => {
    if (!particlesRef.current || !velocitiesRef.current || !lifetimesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const velocities = velocitiesRef.current;
    const lifetimes = lifetimesRef.current;

    for (let i = 0; i < count; i++) {
      // Update lifetime
      lifetimes[i] -= delta;

      if (lifetimes[i] <= 0) {
        // Reset particle
        positions[i * 3] = position[0] + (Math.random() - 0.5) * spread;
        positions[i * 3 + 1] = position[1] + (Math.random() - 0.5) * spread;
        positions[i * 3 + 2] = position[2] + (Math.random() - 0.5) * spread;

        velocities[i * 3] = (Math.random() - 0.5) * 2;
        velocities[i * 3 + 1] = Math.random() * 4;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;

        lifetimes[i] = Math.random() * lifetime;
      } else {
        // Update position
        positions[i * 3] += velocities[i * 3] * delta;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;

        // Apply gravity
        velocities[i * 3 + 1] -= 9.8 * delta;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry />
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}