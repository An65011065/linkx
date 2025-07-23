import React, { useRef, useEffect, useState } from "react";
import { useTheme } from "../hooks/useTheme";

interface ThemeAwareSphereIconProps {
    size?: number;
    className?: string;
}

const ThemeAwareSphereIcon: React.FC<ThemeAwareSphereIconProps> = ({
    size = 18,
    className = "",
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const [isAnimating, setIsAnimating] = useState(true);
    const timeRef = useRef(0);
    const { theme } = useTheme();

    // Get theme-specific colors
    const getThemeColors = () => {
        if (!theme)
            return {
                particle: "rgba(255, 220, 60, 0.8)",
                center: "rgba(255, 255, 255, 0.95)",
            };

        switch (theme.id) {
            case "mono":
            case "amber":
                // Good on dark backgrounds - bright yellow
                return {
                    particle: "rgba(255, 220, 60, 0.8)",
                    center: "rgba(255, 255, 255, 0.95)",
                };
            case "pearl":
                // Light theme - darker orange for contrast
                return {
                    particle: "rgba(146, 64, 14, 0.8)",
                    center: "rgba(92, 38, 4, 0.95)",
                };
            case "cream":
                // Cream theme - brown/orange
                return {
                    particle: "rgba(146, 64, 14, 0.8)",
                    center: "rgba(92, 38, 4, 0.95)",
                };
            case "sage":
                // Green theme - complementary orange
                return {
                    particle: "rgba(146, 64, 14, 0.8)",
                    center: "rgba(92, 38, 4, 0.95)",
                };
            default:
                return {
                    particle: "rgba(146, 64, 14, 0.8)",
                    center: "rgba(92, 38, 4, 0.95)",
                };
        }
    };

    const animate = (): void => {
        if (!canvasRef.current || !isAnimating) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const colors = getThemeColors();

        timeRef.current += 0.02;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Bring back the cool 3D sphere with 8 particles
        const particles = [
            { x: 0.8, y: 0, z: 0 }, // Right
            { x: -0.8, y: 0, z: 0 }, // Left
            { x: 0, y: 0.8, z: 0 }, // Top
            { x: 0, y: -0.8, z: 0 }, // Bottom
            { x: 0.6, y: 0.6, z: 0 }, // Top-right
            { x: -0.6, y: 0.6, z: 0 }, // Top-left
            { x: 0.6, y: -0.6, z: 0 }, // Bottom-right
            { x: -0.6, y: -0.6, z: 0 }, // Bottom-left
        ];

        const radius = size * 0.4;

        particles.forEach((particle, i) => {
            // 3D rotation around Y axis (the cool part!)
            const rotY = timeRef.current * 0.4;
            const rotatedX =
                particle.x * Math.cos(rotY) - particle.z * Math.sin(rotY);
            const rotatedZ =
                particle.x * Math.sin(rotY) + particle.z * Math.cos(rotY);

            // Pulsing effect
            const pulse =
                Math.sin(
                    timeRef.current * 2 + (i / particles.length) * Math.PI * 2,
                ) *
                    0.3 +
                1;

            // 3D to 2D projection (the depth effect!)
            const perspective = size * 2;
            const scale = perspective / (perspective + rotatedZ * radius);
            const screenX = centerX + rotatedX * radius * scale;
            const screenY = centerY + particle.y * radius * scale;

            // Depth-based effects
            const depth = (rotatedZ * radius + radius) / (radius * 2);
            const finalOpacity = (0.4 + depth * 0.6) * pulse;
            const finalSize = size * 0.08 * scale * pulse;

            // Draw particle with theme color
            if (finalOpacity > 0.2) {
                ctx.fillStyle = colors.particle.replace(
                    "0.8",
                    finalOpacity.toString(),
                );
                ctx.beginPath();
                ctx.arc(screenX, screenY, finalSize, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Center with gentle pulse
        const centerPulse = Math.sin(timeRef.current * 1.5) * 0.2 + 1;
        ctx.fillStyle = colors.center;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.12 * centerPulse, 0, Math.PI * 2);
        ctx.fill();

        animationRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        if (isAnimating) {
            animate();
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isAnimating, theme]); // Re-render when theme changes

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className={className}
            style={{ display: "block" }}
        />
    );
};

export default ThemeAwareSphereIcon;
