'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useMobile } from '@/hooks/use-mobile';

export default function SpaceFlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const isMobile = useMobile();

  // Use refs for game state to avoid closure issues
  const gameStateRef = useRef({
    birdY: 0,
    birdVelocity: 0,
    obstacles: [] as {x: number, height: number, passed: boolean}[],
    animationFrameId: 0,
    score: 0
  });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game constants
    const birdSize = 30;
    const birdX = 100;
    const obstacleWidth = 50;
    const gapHeight = 150;
    const gravity = 0.5;
    const jumpStrength = -8;

    // Initialize bird position
    gameStateRef.current.birdY = canvas.height / 2;
    // Create stars for background
    const stars: {x: number, y: number, size: number}[] = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1
      });
    }

    const drawBackground = () => {
      // Dark blue background
      ctx.fillStyle = '#001033';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Yellow stars
      ctx.fillStyle = '#FFFF00';
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawBird = () => {
      ctx.save();
      ctx.translate(birdX, gameStateRef.current.birdY);

      // Add rotation based on velocity
      const rotation = Math.min(Math.max(gameStateRef.current.birdVelocity * 0.05, -0.5), 0.5);
      ctx.rotate(rotation);

      // Draw bird emoji
      ctx.font = `${birdSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐥', 0, 0);

      ctx.restore();
    };

    const createObstacle = () => {
      const height = Math.random() * (canvas.height - gapHeight - 100) + 50;
      gameStateRef.current.obstacles.push({
        x: canvas.width,
        height,
        passed: false
      });
    };

    const drawObstacles = () => {
      // Purple tree obstacles
      ctx.fillStyle = '#8A2BE2'; // Purple color
      gameStateRef.current.obstacles.forEach(obstacle => {
        // Bottom obstacle
        ctx.fillRect(obstacle.x, obstacle.height + gapHeight, obstacleWidth, canvas.height - obstacle.height - gapHeight);
        // Top obstacle
        ctx.fillRect(obstacle.x, 0, obstacleWidth, obstacle.height);
        // Add some branch-like details to make them look like trees
        const branchColor = '#9370DB'; // Lighter purple
        ctx.fillStyle = branchColor;
        // Branches for top obstacle
        ctx.fillRect(obstacle.x - 15, obstacle.height - 20, 15, 5);
        ctx.fillRect(obstacle.x + obstacleWidth, obstacle.height - 40, 15, 5);
        // Branches for bottom obstacle
        ctx.fillRect(obstacle.x - 15, obstacle.height + gapHeight + 30, 15, 5);
        ctx.fillRect(obstacle.x + obstacleWidth, obstacle.height + gapHeight + 50, 15, 5);
        ctx.fillStyle = '#8A2BE2'; // Reset to main color
      });
    };

    const updateGame = () => {
      if (!gameStarted || gameOver) return;
      // Update bird position
      gameStateRef.current.birdVelocity += gravity;
      gameStateRef.current.birdY += gameStateRef.current.birdVelocity;

      // Calculate hitbox for the bird (smaller than the emoji to make collision more forgiving)
      const birdHitboxSize = birdSize * 0.6;
      // Check for collision with top/bottom
      if (gameStateRef.current.birdY - birdHitboxSize / 2 <= 0 || 
          gameStateRef.current.birdY + birdHitboxSize / 2 >= canvas.height) {
        endGame();
        return;
      }
      // Create new obstacles
      if (gameStateRef.current.obstacles.length === 0 || 
          gameStateRef.current.obstacles[gameStateRef.current.obstacles.length - 1].x < canvas.width - 200) {
        createObstacle();
      }
      // Update obstacles and check collisions
      for (let i = 0; i < gameStateRef.current.obstacles.length; i++) {
        gameStateRef.current.obstacles[i].x -= 2;
        // Remove off-screen obstacles
        if (gameStateRef.current.obstacles[i].x + obstacleWidth < 0) {
          gameStateRef.current.obstacles.splice(i, 1);
          i--;
          continue;
        }
        // Check for collision
        if (
          gameStateRef.current.obstacles[i].x < birdX + birdHitboxSize / 2 && 
          gameStateRef.current.obstacles[i].x + obstacleWidth > birdX - birdHitboxSize / 2
        ) {
          if (
            gameStateRef.current.birdY - birdHitboxSize / 2 < gameStateRef.current.obstacles[i].height || 
            gameStateRef.current.birdY + birdHitboxSize / 2 > gameStateRef.current.obstacles[i].height + gapHeight
          ) {
            endGame();
            return;
          }
        }
        // Update score when obstacle is passed
        if (!gameStateRef.current.obstacles[i].passed && 
            gameStateRef.current.obstacles[i].x + obstacleWidth < birdX) {
          gameStateRef.current.obstacles[i].passed = true;
          gameStateRef.current.score += 1;
          setScore(gameStateRef.current.score);
        }
      }
      // Draw everything
      drawBackground();
      drawObstacles();
      drawBird();
      // Continue animation
      gameStateRef.current.animationFrameId = requestAnimationFrame(updateGame);
    };

    const jump = () => {
      if (gameOver || !gameStarted) return;
      gameStateRef.current.birdVelocity = jumpStrength;
    };
    const endGame = () => {
      setGameOver(true);
      cancelAnimationFrame(gameStateRef.current.animationFrameId);
      // Draw "Game Over" text
      drawBackground();
      drawObstacles();
      drawBird();
      ctx.fillStyle = 'white';
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 30);
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.font = '20px Arial';
      ctx.fillText(isMobile ? 'Tap to Restart' : 'Press Space to Restart', canvas.width / 2, canvas.height / 2 + 50);
    };
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameStarted && !gameOver) {
        e.preventDefault();
        jump();
      }
    };

    // Initial drawing
    drawBackground();

    // Draw a preview bird
    ctx.font = `${birdSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐥', birdX, gameStateRef.current.birdY);
    // Add event listeners
    window.addEventListener('keydown', keyDownHandler);
    canvas.addEventListener('click', () => {
      if (gameStarted && !gameOver) jump();
    });
    // Start game loop if game is started
    if (gameStarted && !gameOver) {
      gameStateRef.current.animationFrameId = requestAnimationFrame(updateGame);
    }
    return () => {
      window.removeEventListener('keydown', keyDownHandler);
      canvas.removeEventListener('click', jump);
      cancelAnimationFrame(gameStateRef.current.animationFrameId);
    };
  }, [gameStarted, gameOver, isMobile]);

  // Reset the game state when starting/restarting
  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameStateRef.current.birdY = canvasRef.current?.height ? canvasRef.current.height / 2 : 250;
      gameStateRef.current.birdVelocity = 0;
      gameStateRef.current.obstacles = [];
      gameStateRef.current.score = 0;
      setScore(0);
    }
  }, [gameStarted, gameOver]);

  const handleStartGame = () => {
    setGameStarted(true);
    setGameOver(false);
  };

  const handleRestartGame = () => {
    setGameStarted(true);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={500}
          className="border border-gray-400 rounded-lg shadow-lg"
          style={{ touchAction: 'none' }} // Prevent scrolling on touch
        />

        {/* Game UI overlay */}
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
            <h2 className="text-3xl font-bold mb-4">Space Flappy Bird</h2>
            <p className="mb-6">Help the chick navigate through space!</p>
            <Button 
              onClick={handleStartGame}
              className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg"
            >
              Start Game
            </Button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
            <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
            <p className="text-2xl mb-6">Score: {score}</p>
            <Button 
              onClick={handleRestartGame}
              className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg"
            >
              Play Again
            </Button>
          </div>
        )}
      </div>

      {gameStarted && !gameOver && (
        <div className="mt-4 text-xl font-bold">Score: {score}</div>
      )}

      {gameStarted && !gameOver && (
        <div className="mt-4 text-sm text-gray-300">
          {isMobile ? "Tap on the game to flap" : "Press SPACE or click to flap"}
        </div>
      )}
    </div>
  );
}