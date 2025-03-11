'use client';

import { useEffect, useState, useRef } from 'react';
import { useMobile } from '@/hooks/use-mobile'; // We'll create this hook

export default function SpaceFlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const isMobile = useMobile();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game constants
    const birdSize = 30;
    const obstacleWidth = 50;
    const gapHeight = 150;
    let birdY = canvas.height / 2;
    let birdVelocity = 0;
    const gravity = 0.5;
    const jumpStrength = -8;
    const obstacles: {x: number, height: number, passed: boolean}[] = [];
    let animationFrameId: number;
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
      // Yellow bird in space suit
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.arc(100, birdY, birdSize / 2, 0, Math.PI * 2);
      ctx.fill();
      // Simple space helmet
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(100, birdY, birdSize / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();
    };

    const createObstacle = () => {
      const height = Math.random() * (canvas.height - gapHeight - 100) + 50;
      obstacles.push({
        x: canvas.width,
        height,
        passed: false
      });
    };

    const drawObstacles = () => {
      // Purple tree obstacles
      ctx.fillStyle = '#8A2BE2'; // Purple color
      obstacles.forEach(obstacle => {
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
      birdVelocity += gravity;
      birdY += birdVelocity;
      // Check for collision with top/bottom
      if (birdY <= birdSize / 2 || birdY >= canvas.height - birdSize / 2) {
        endGame();
        return;
      }
      // Create new obstacles
      if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 200) {
        createObstacle();
      }
      // Update obstacles and check collisions
      for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].x -= 2;
        // Remove off-screen obstacles
        if (obstacles[i].x + obstacleWidth < 0) {
          obstacles.splice(i, 1);
          i--;
          continue;
        }
        // Check for collision
        if (obstacles[i].x < 100 + birdSize / 2 && obstacles[i].x + obstacleWidth > 100 - birdSize / 2) {
          if (birdY - birdSize / 2 < obstacles[i].height || birdY + birdSize / 2 > obstacles[i].height + gapHeight) {
            endGame();
            return;
          }
        }
        // Update score when obstacle is passed
        if (!obstacles[i].passed && obstacles[i].x + obstacleWidth < 100) {
          obstacles[i].passed = true;
          setScore(prevScore => prevScore + 1);
        }
      }
      // Draw everything
      drawBackground();
      drawObstacles();
      drawBird();
      // Continue animation
      animationFrameId = requestAnimationFrame(updateGame);
    };

    const jump = () => {
      if (gameOver) {
        resetGame();
        return;
      }
      if (!gameStarted) {
        setGameStarted(true);
      }
      birdVelocity = jumpStrength;
    };
    const endGame = () => {
      setGameOver(true);
      cancelAnimationFrame(animationFrameId);
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
    const resetGame = () => {
      birdY = canvas.height / 2;
      birdVelocity = 0;
      obstacles.length = 0;
      setScore(0);
      setGameOver(false);
      setGameStarted(true);
      animationFrameId = requestAnimationFrame(updateGame);
    };
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    const touchStartHandler = (e: TouchEvent) => {
      e.preventDefault(); // Prevent default behavior
      jump();
    };
    // Start initial drawing
    drawBackground();
    drawBird();
    // Add event listeners
    window.addEventListener('keydown', keyDownHandler);
    canvas.addEventListener('click', jump);
    canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
    // Start game loop if game is started
    if (gameStarted && !gameOver) {
      animationFrameId = requestAnimationFrame(updateGame);
    }
    return () => {
      window.removeEventListener('keydown', keyDownHandler);
      canvas.removeEventListener('click', jump);
      canvas.removeEventListener('touchstart', touchStartHandler);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, gameOver, score, isMobile]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={500}
          className="border border-gray-400 rounded-lg shadow-lg max-w-full"
          style={{ touchAction: 'none' }} // Prevent scrolling on touch
        />
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
            <h2 className="text-3xl font-bold mb-4">Space Flappy Bird</h2>
            <p className="mb-6">{isMobile ? 'Tap to start' : 'Press Space or Click to start'}</p>
          </div>
        )}
      </div>
      <div className="mt-4 text-xl font-bold">Score: {score}</div>
    </div>
  );
}