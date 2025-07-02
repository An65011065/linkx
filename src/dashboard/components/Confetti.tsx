import React, { useEffect, useRef } from "react";

interface ConfettiProps {
    duration?: number;
}

const Confetti: React.FC<ConfettiProps> = ({ duration = 2000 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size to window size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ["#27ae60", "#e74c3c", "#9b59b6", "#f39c12"];
        const confetti: Array<{
            x: number;
            y: number;
            color: string;
            size: number;
            angle: number;
            velocity: { x: number; y: number };
            angularVel: number;
            shape: "rect" | "circle";
        }> = [];

        // Create confetti particles with more variety and quantity
        for (let i = 0; i < 2000; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 10 + 5; // Increased base speed
            confetti.push({
                x: Math.random() * canvas.width,
                y: -20, // Start slightly above the screen
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 12 + 8, // Slightly larger particles
                angle: angle,
                velocity: {
                    x: Math.cos(angle) * speed * 0.7,
                    y: Math.sin(angle) * speed + speed * 0.5,
                },
                angularVel: (Math.random() - 0.5) * 0.3, // Faster rotation
                shape: Math.random() > 0.5 ? "rect" : "circle",
            });
        }

        let animationFrame: number;
        const startTime = Date.now();
        const gravity = 0.35; // Added gravity effect
        const drag = 0.98; // Added air resistance

        const animate = () => {
            if (Date.now() - startTime > duration) {
                cancelAnimationFrame(animationFrame);
                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            confetti.forEach((particle) => {
                // Apply gravity and drag
                particle.velocity.y += gravity;
                particle.velocity.x *= drag;
                particle.velocity.y *= drag;

                // Update position
                particle.x += particle.velocity.x;
                particle.y += particle.velocity.y;
                particle.angle += particle.angularVel;

                // Wrap around screen edges
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.y > canvas.height) {
                    particle.y = -20;
                    particle.velocity.y = Math.random() * 10 + 5;
                }

                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.angle);

                ctx.fillStyle = particle.color;
                if (particle.shape === "rect") {
                    ctx.fillRect(
                        -particle.size / 2,
                        -particle.size / 2,
                        particle.size,
                        particle.size,
                    );
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            });

            animationFrame = requestAnimationFrame(animate);
        };

        // Create initial burst effect
        confetti.forEach((particle) => {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 15 + 10;
            particle.velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed - 10, // Initial upward burst
            };
        });

        animate();

        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, [duration]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                pointerEvents: "none",
                zIndex: 10000,
            }}
        />
    );
};

export default Confetti;
