import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { CardMesh } from './CardMesh';
import { useGameStore } from '../../store/gameStore';

export function GameScene() {
  const { currentRoom, getMyPlayer, isMyTurn } = useGameStore();
  const myPlayer = getMyPlayer();
  
  if (!currentRoom || !myPlayer) return null;

  const { hand } = myPlayer;
  const myTurn = isMyTurn();

  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[0, 5, 10]} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 4}
      />
      
      {/* Ambient light */}
      <ambientLight intensity={0.5} />
      
      {/* Main directional light */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Table surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a472a" roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Player's hand */}
      {hand.map((card, index) => {
        const angle = (index - (hand.length - 1) / 2) * 0.1;
        const x = Math.sin(angle) * 5;
        const z = -Math.cos(angle) * 5 + 6;
        
        return (
          <CardMesh
            key={card.id}
            position={[x, 1, z]}
            rotation={[0, angle, 0]}
            color={card.color}
            value={card.value}
            isWild={card.color === 'wild'}
            onClick={myTurn ? () => {/* Handle card play */} : undefined}
          />
        );
      })}
      
      {/* Environment map for reflections */}
      <Environment preset="sunset" />
    </Canvas>
  );
}