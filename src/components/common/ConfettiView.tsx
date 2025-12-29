import { useEffect, useRef } from 'react';
import { GoalLevel } from '../../types';

interface ConfettiViewProps {
  level: GoalLevel;
  startPosition: { x: number; y: number };
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  opacity: number;
}

const LEVEL_COLORS: Record<GoalLevel, string[]> = {
  daily: ['#FF6B1A', '#FF8C42', '#FFA94D', '#FF7F2A'], // オレンジ系（より濃く）
  weekly: ['#9F7AEA', '#B794F6', '#A78BFA', '#8B5CF6'], // パープル系（より濃く）
  monthly: ['#14B8A6', '#2DD4BF', '#5EEAD4', '#0D9488'], // ティール系（より濃く）
};

export default function ConfettiView({ level, startPosition, onComplete }: ConfettiViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const onCompleteRef = useRef(onComplete);

  // 最新のonCompleteを常に参照
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to parent container size
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    } else {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    // Create particles
    const particles: Particle[] = [];
    const colors = LEVEL_COLORS[level];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      // Float upward with gentle horizontal spread
      particles.push({
        x: startPosition.x,
        y: startPosition.y,
        vx: (Math.random() - 0.5) * 6, // Gentle horizontal spread: -3 to 3
        vy: -(Math.random() * 3 + 4), // Modest upward velocity: -4 to -7 (negative is up)
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        opacity: 1,
      });
    }

    let startTime = Date.now();
    const duration = 3000; // 3 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;
        particle.vy += 0.15; // gravity

        // Fade out near the end
        if (progress > 0.7) {
          particle.opacity = 1 - (progress - 0.7) / 0.3;
        }

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.globalAlpha = particle.opacity;

        // Add shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillStyle = particle.color;

        // Draw rectangle
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);

        ctx.restore();
      });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        onCompleteRef.current?.();
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [level, startPosition]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-50"
    />
  );
}
