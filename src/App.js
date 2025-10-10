import React, { useEffect, useRef, useState } from 'react';
import { User, Briefcase, Link as LinkIcon, Linkedin, Github, Twitter } from 'lucide-react';

const App = () => {
  const canvasRef = useRef(null);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Adjust canvas for device pixel ratio
    const resizeCanvas = () => {
      const width = canvas.clientWidth;
      const height = 400; // Fixed height
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      ctx.scale(dpr, dpr);

      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Store mouse or touch position
    const mousePos = { x: null, y: null, isActive: false };

    // Handle mouse movement
    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.x = event.clientX - rect.left;
      mousePos.y = event.clientY - rect.top;
      mousePos.isActive = true;
    };

    // Handle touch movement
    const handleTouchMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.x = event.touches[0].clientX - rect.left;
      mousePos.y = event.touches[0].clientY - rect.top;
      mousePos.isActive = true;
    };

    // Reset mouse position when cursor leaves canvas
    const handleMouseOut = () => {
      mousePos.isActive = false;
    };

    // Add event listeners to the canvas
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('mouseout', handleMouseOut);

    // Restore the Ring class for the floating orbs
    class Ring {
      constructor(radius, speed) {
        this.radius = radius;
        this.speed = speed;
        this.angle = Math.random() * Math.PI * 2;
        this.x = 0;
        this.y = 0;
        this.hue = Math.random() * 360; // Full color spectrum
      }

      update() {
        this.radius -= this.speed;
        this.angle += 0.0005; // Slower movement for a relaxed feel
        this.x = Math.cos(this.angle) * 100;
        this.y = Math.sin(this.angle) * 100;
        if (this.radius < 0) {
          this.radius = canvas.width * 0.8;
        }
      }

      draw(ctx, centerX, centerY) {
        const gradient = ctx.createRadialGradient(
          centerX + this.x,
          centerY + this.y,
          0,
          centerX + this.x,
          centerY + this.y,
          this.radius
        );
        gradient.addColorStop(0, `hsla(${this.hue}, 100%, 70%, 0.1)`);
        gradient.addColorStop(0.5, `hsla(${this.hue + 30}, 100%, 50%, 0.05)`);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(centerX + this.x, centerY + this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    const rings = Array.from({ length: 5 }, () => new Ring(
      canvas.width * Math.random() * 0.8,
      0.1 + Math.random() * 0.2 // Slower speed for relaxed movement
    ));

    // Particle class for the cursor trail effect
    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = (Math.random() * 30) + 20; // Sizes between 20 and 50
        this.hue = Math.random() * 360; // Full color spectrum
        this.alpha = 0.05; // Lower opacity for softer effect
        this.life = 0; // Time since creation
        this.maxLife = 100 + Math.random() * 50; // Lifetime between 100 and 150 frames
        this.initialAlpha = this.alpha;
        this.velocity = {
          x: (Math.random() - 0.5) * 0.1, // Very small random movement
          y: (Math.random() - 0.5) * 0.1, // Very small random movement
        };
      }

      update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.life++;
        if (this.life >= this.maxLife) {
          this.alpha = 0;
        } else {
          this.alpha = this.initialAlpha * (1 - this.life / this.maxLife);
        }
      }

      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = `hsla(${this.hue}, 100%, 70%, ${this.alpha})`;

        // Add shadow blur for softer look
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsla(${this.hue}, 100%, 70%, ${this.alpha})`;

        ctx.beginPath();
        ctx.ellipse(
          this.x,
          this.y,
          this.size,
          this.size * (Math.random() * 0.3 + 0.7), // Less randomization
          0, // No rotation for smoother effect
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      }
    }

    

    const particles = [];

    const drawScene = () => {
      // Clear the canvas with a very transparent fill to create a trail effect
      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Update and draw rings
      rings.forEach((ring) => {
        ring.update();
        ring.draw(ctx, centerX, centerY);
      });

      // Create new particles at the cursor position
      if (mousePos.isActive) {
        particles.push(new Particle(mousePos.x, mousePos.y));
      }


      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 10 - 5;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
      }
      ctx.putImageData(imageData, 0, 0);

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.update();
        p.draw(ctx);

        // Remove particles that have faded out
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          i--;
        }
      }
    };

   

    const animate = () => {
      drawScene();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup event listeners and animation frame
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  const categories = [
    { title: 'Bio', icon: User, content: 'Your biography goes here...' },
    { title: 'Projects', icon: Briefcase, content: 'List of your projects...' },
    { title: 'Links', icon: LinkIcon, content: 'Important links go here...' },
  ];

    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0a0a0a', 
        color: 'white', 
        fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{
          height: '400px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
            }}
          />
          <div style={{
          position: 'absolute',
          top: 210,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '2rem',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 'bold', marginBottom: '-0.8rem' }}>
              Hey, I'm Sam
            </h1>
            <p style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', opacity: 0.8 }}>
              Software Engineer based in San Francisco
            </p>
          </div>
        </div>
        
        <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: '2rem',
      }}>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '1rem' }}>About me</h2>
            <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', lineHeight: '1.6', marginBottom: '1rem' }}>
              At the moment I'm working on moteo.dev, aplatform for producing motion graphics with AI
            </p>
    
            <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', lineHeight: '1.6', marginBottom: '1rem' }}>
            </p>

          </section>
  
          <section>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '1rem' }}>Connect with me</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="https://www.linkedin.com/in/sam-inloes-134117a0/" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none' }}>
                <Linkedin size={24} />
              </a>
              <a href="https://github.com/Sami1309" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none' }}>
                <Github size={24} />
              </a>
              <a href="https://twitter.com/SamInloes" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none' }}>
                <Twitter size={24} />
              </a>
            </div>
          </section>
        </main>
      </div>
    );
};

export default App;
