import React, { useRef, useEffect, useState } from "react";

const GalaxyLogo = ({ size = 120, showPlayButton = true }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const starsRef = useRef([]);
    const timeRef = useRef(0);

    const galaxyConfig = {
        armCount: 4,
        starCount: 80,
        maxRadius: size * 0.375, // 45px for 120px size
        rotationRate: 0.3,
        spiralTightness: 3.0,
    };

    const generateStars = () => {
        const stars = [];
        for (let i = 0; i < galaxyConfig.starCount; i++) {
            const radiusRatio = Math.random();
            const distance =
                Math.pow(radiusRatio, 0.8) * galaxyConfig.maxRadius;

            const armIndex = Math.floor(Math.random() * galaxyConfig.armCount);
            const armBaseAngle =
                (armIndex / galaxyConfig.armCount) * Math.PI * 2;

            const spiralAngle =
                armBaseAngle +
                (distance / galaxyConfig.maxRadius) *
                    galaxyConfig.spiralTightness *
                    Math.PI;
            const angleVariation = (Math.random() - 0.5) * 0.2;

            stars.push({
                radius: distance,
                angle: spiralAngle + angleVariation,
                armIndex: armIndex,
                brightness: Math.random() * 0.8 + 0.2,
                size: Math.random() * 1.5 + 0.3,
                rotationSpeed: 1 + Math.random() * 0.5,
                twinklePhase: Math.random() * Math.PI * 2,
                colorTemp: distance / galaxyConfig.maxRadius,
            });
        }
        return stars;
    };

    const animate = () => {
        if (!canvasRef.current || !isAnimating) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        timeRef.current += 0.016;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw solid galactic core
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.042, 0, Math.PI * 2); // 5px for 120px size
        ctx.fill();

        // Draw and update stars
        starsRef.current.forEach((star) => {
            const rotationFactor = Math.pow(
                1 - star.radius / galaxyConfig.maxRadius,
                0.7,
            );
            star.angle +=
                galaxyConfig.rotationRate *
                rotationFactor *
                star.rotationSpeed *
                0.01;

            const x = centerX + Math.cos(star.angle) * star.radius;
            const y = centerY + Math.sin(star.angle) * star.radius;

            let red, green, blue;
            if (star.colorTemp < 0.5) {
                const mix = star.colorTemp * 2;
                red = 100 + mix * 155;
                green = 150 + mix * 105;
                blue = 255;
            } else {
                const mix = (star.colorTemp - 0.5) * 2;
                red = 255;
                green = 255 - mix * 100;
                blue = 255 - mix * 200;
            }

            star.twinklePhase += 0.05 + Math.random() * 0.03;
            const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7;

            const armAlignment = Math.cos(
                (star.angle - (star.armIndex * Math.PI) / 2) *
                    galaxyConfig.armCount,
            );
            const armBrightness = Math.max(0, armAlignment) * 0.4 + 0.6;

            const finalBrightness = star.brightness * twinkle * armBrightness;
            const finalSize = star.size * (0.8 + twinkle * 0.4);

            ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${finalBrightness})`;
            ctx.beginPath();
            ctx.arc(x, y, finalSize, 0, Math.PI * 2);
            ctx.fill();
        });

        animationRef.current = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
        setIsAnimating(true);
    };

    const stopAnimation = () => {
        setIsAnimating(false);
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        // Clear canvas
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            ctx.clearRect(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height,
            );
        }
    };

    useEffect(() => {
        starsRef.current = generateStars();
    }, [size]);

    useEffect(() => {
        if (isAnimating) {
            animate();
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isAnimating]);

    return (
        <div className="flex flex-col items-center justify-center">
            <div
                className="relative flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                <canvas
                    ref={canvasRef}
                    width={size}
                    height={size}
                    className="absolute left-0 top-0"
                />

                {showPlayButton && (
                    <button
                        onClick={isAnimating ? stopAnimation : startAnimation}
                        className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-blue-400/10 border-2 border-blue-400/30 hover:bg-blue-400/20 hover:border-blue-400/50 hover:shadow-blue-400/30 hover:shadow-lg transition-all duration-300 flex items-center justify-center z-10"
                    >
                        {isAnimating ? (
                            <div className="w-2 h-2 bg-blue-400/90" />
                        ) : (
                            <div
                                className="w-0 h-0 ml-0.5"
                                style={{
                                    borderLeft:
                                        "8px solid rgba(59, 130, 246, 0.9)",
                                    borderTop: "5px solid transparent",
                                    borderBottom: "5px solid transparent",
                                }}
                            />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default GalaxyLogo;
