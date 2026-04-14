/**
 * Hero Component
 * 
 * The main landing page animated heroic section. Implements a scroll-driven 
 * canvas animation blending multiple PNG frames to reveal a digital vault.
 */
(function () {
  const { useEffect, useRef } = React;
  const { motion } = window.Motion;
  const { Button } = window;
  const { Link } = window.Router;

  const Hero = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const frameCount = 167;
      const currentFrame = index => `/public/frames/${index.toString().padStart(3, '0')}.png`;

      const images = [];
      let loadedImages = 0;

      for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        img.onload = () => {
          loadedImages++;
          if (i === 1) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
          if (loadedImages === frameCount) {
            handleScroll();
          }
        };
        images.push(img);
      }

      const render = (exactIndex) => {
        const index1 = Math.floor(exactIndex);
        const index2 = Math.min(frameCount - 1, index1 + 1);
        const blendFraction = exactIndex - index1;

        if (images[index1] && images[index1].complete) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw the base frame
          ctx.globalAlpha = 1;
          ctx.drawImage(images[index1], 0, 0, canvas.width, canvas.height);

          // Crossfade the next frame on top if we are between integers
          if (blendFraction > 0.01 && images[index2] && images[index2].complete) {
            ctx.globalAlpha = blendFraction;
            ctx.drawImage(images[index2], 0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1; // RESET
          }
        }
      };

      const handleScroll = () => {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const scrollFraction = Math.max(0, Math.min(window.scrollY / maxScroll, 1));

        // Retain the exact float value so we can blend between frames
        const exactFrameIndex = scrollFraction * (frameCount - 1);
        requestAnimationFrame(() => render(exactFrameIndex));
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      // Run once on mount in case they loaded halfway down
      setTimeout(handleScroll, 100);

      return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
      <>
        <div className="fixed inset-0 z-0 pointer-events-none flex justify-center items-center overflow-hidden">
          {/* Background Canvas */}
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
            style={{ WebkitMaskImage: "linear-gradient(to bottom, black 80%, transparent 100%)", maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)" }}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-900/60 to-navy-900 shadow-[inset_0_0_100px_rgba(10,15,28,1)] z-0" />

          {/* Glows */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-700/10 rounded-full blur-[140px] pointer-events-none mix-blend-screen" />
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-700/10 rounded-full blur-[140px] pointer-events-none mix-blend-screen" style={{ animationDelay: "2s" }} />
        </div>

        <section className="relative min-h-[95vh] flex items-center justify-center z-10 pt-20">
          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8 flex flex-col items-center"
            >
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-medium backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>Intelligent Vault Active</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight tracking-tight drop-shadow-2xl">
                Never Lose Track of <br />
                <span className="text-gradient drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">
                  Your Life Documents
                </span>
              </h1>

              <p className="text-xl text-slate-300 max-w-2xl text-balance leading-relaxed text-center drop-shadow-xl font-medium">
                Secure your passports, insurance papers, certificates and important records in one intelligent vault. Always encrypted, never forgotten.
              </p>

              <div className="flex items-center justify-center space-x-4 pt-4">
                <Link to="/register">
                  <Button className="shadow-[0_0_20px_rgba(6,182,212,0.5)] px-8 py-3.5 text-lg border cursor-pointer border-cyan-400">Get Started</Button>
                </Link>
                <Button variant="secondary" className="bg-navy-900/60 backdrop-blur-md border border-white/20 hover:bg-navy-800 px-8 py-3.5 text-lg shadow-xl relative z-20 cursor-pointer">
                  See How It Works
                </Button>
              </div>

              <div className="pt-8 flex items-center justify-center space-x-8 text-sm text-slate-300 font-semibold drop-shadow-md">
                <span className="flex items-center"><window.Icons.Check size={18} className="text-cyan-400 mr-2 drop-shadow-glow" /> Bank-level Encryption</span>
                <span className="flex items-center"><window.Icons.Check size={18} className="text-cyan-400 mr-2 drop-shadow-glow" /> Auto-reminders</span>
              </div>
            </motion.div>
          </div>
        </section>
      </>
    );
  };

  window.Hero = Hero;
})();
