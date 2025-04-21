import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

interface CardMeshProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  value: string;
  isWild?: boolean;
  isFlipped?: boolean;
  onClick?: () => void;
}

export function CardMesh({
  position,
  rotation = [0, 0, 0],
  color,
  value,
  isWild = false,
  isFlipped = false,
  onClick,
}: CardMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { nodes, materials } = useGLTF('/models/card.glb');

  // Handle card flip animation
  useEffect(() => {
    if (meshRef.current) {
      gsap.to(meshRef.current.rotation, {
        y: isFlipped ? Math.PI : 0,
        duration: 0.6,
        ease: 'power2.inOut',
      });
    }
  }, [isFlipped]);

  // Hover effect
  useEffect(() => {
    if (meshRef.current && onClick) {
      const mesh = meshRef.current;
      
      const onPointerEnter = () => {
        gsap.to(mesh.position, {
          y: position[1] + 0.5,
          duration: 0.3,
          ease: 'power2.out',
        });
      };
      
      const onPointerLeave = () => {
        gsap.to(mesh.position, {
          y: position[1],
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      mesh.addEventListener('pointerenter', onPointerEnter);
      mesh.addEventListener('pointerleave', onPointerLeave);

      return () => {
        mesh.removeEventListener('pointerenter', onPointerEnter);
        mesh.removeEventListener('pointerleave', onPointerLeave);
      };
    }
  }, [position, onClick]);

  // Gentle floating animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime) * 0.0005;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onClick={onClick}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[2.5, 3.5, 0.05]} />
      <meshStandardMaterial
        map={isFlipped ? nodes.CardBack.material.map : getCardTexture(color, value)}
        roughness={0.3}
        metalness={0.2}
      />
    </mesh>
  );
}

// Helper function to get card texture based on color and value
function getCardTexture(color: string, value: string): THREE.Texture {
  // This would be replaced with actual texture loading logic
  const texture = new THREE.TextureLoader().load(`/textures/cards/${color}_${value}.jpg`);
  texture.encoding = THREE.sRGBEncoding;
  return texture;
}