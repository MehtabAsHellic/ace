import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { Game } from './pages/Game';
import { useGameStore } from './store/gameStore';
import { useEffect } from 'react';
import { socket } from './socket';

function App() {
  const { isConnected, setIsConnected, setPlayerName, playerName } = useGameStore();

  useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
    }

    // Connect to socket server
    socket.connect();

    // Listen for connection events
    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
    };
  }, [setIsConnected, setPlayerName]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/lobby/:roomId" 
          element={playerName ? <Lobby /> : <Navigate to="/" />} 
        />
        <Route 
          path="/game/:roomId" 
          element={playerName ? <Game /> : <Navigate to="/" />} 
        />
      </Routes>
    </div>
  );
}

export default App;