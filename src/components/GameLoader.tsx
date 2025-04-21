import React from 'react';

interface GameLoaderProps {
  message: string;
}

export const GameLoader: React.FC<GameLoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="loader mb-4">
        <div className="card-loader red"></div>
        <div className="card-loader blue"></div>
        <div className="card-loader green"></div>
        <div className="card-loader yellow"></div>
      </div>
      <p className="text-xl text-gray-300">{message}</p>
      <style jsx>{`
        .loader {
          display: flex;
          position: relative;
          width: 80px;
          height: 80px;
        }
        .card-loader {
          width: 30px;
          height: 40px;
          position: absolute;
          border-radius: 5px;
          animation: loading-card 1.5s ease-in-out infinite;
          transform-origin: center;
        }
        .red {
          background-color: #e53e3e;
          left: 0;
          top: 10px;
          animation-delay: 0s;
        }
        .blue {
          background-color: #3182ce;
          left: 10px;
          top: 5px;
          animation-delay: 0.1s;
        }
        .green {
          background-color: #38a169;
          left: 20px;
          top: 0;
          animation-delay: 0.2s;
        }
        .yellow {
          background-color: #ecc94b;
          left: 30px;
          top: 5px;
          animation-delay: 0.3s;
        }
        @keyframes loading-card {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(10px) rotate(5deg);
          }
        }
      `}</style>
    </div>
  );
};