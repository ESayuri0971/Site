// Assembly particle effect for the "experience" section
// Uses Three.js to render particles on the <canvas id=\"assembly-particles\"></canvas>
// Scroll progress drives a smooth transition from scattered particles to a sphere
// and reveals the virtual DAW browser.

(() => {
  // Ensure DOM loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    const canvas = document.getElementById('assembly-particles');
    if (!canvas) return;

    // --- Three.js setup ---------------------------------------------------
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0, 200);

    // Resize handling
    function onResize() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    }
    window.addEventListener('resize', onResize);
    onResize();

    // --- Particle geometry ------------------------------------------------
    const PARTICLE_COUNT = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const targets = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    const range = 150; // spread range for scattered state
    const radius = 80; // sphere radius
    const color = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // scattered start positions
      positions[i * 3] = (Math.random() - 0.5) * range;
      positions[i * 3 + 1] = (Math.random() - 0.5) * range;
      positions[i * 3 + 2] = (Math.random() - 0.5) * range;

      // target sphere positions using Fibonacci sphere algorithm
      const phi = Math.acos(1 - 2 * (i + 0.5) / PARTICLE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      targets[i * 3] = x;
      targets[i * 3 + 1] = y;
      targets[i * 3 + 2] = z;

      // colour gradient – alternating copper / ink
      color.setStyle(i % 2 === 0 ? '#e7b691' : '#f1f2f3');
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('target', new THREE.BufferAttribute(targets, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // --- Scroll handling -------------------------------------------------
    let progress = 0; // 0 = scattered, 1 = assembled

    function setupScroll() {
      if (window.gsap && gsap.ScrollTrigger) {
        gsap.to({ p: 0 }, {
          p: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '.assembly',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            pin: true,
          },
          onUpdate: (self) => { progress = self.targets()[0].p; },
        });
      } else {
        const section = document.querySelector('.assembly');
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const start = rect.top + window.scrollY;
        const end = start + section.offsetHeight;
        const onScroll = () => {
          const y = window.scrollY;
          progress = Math.min(1, Math.max(0, (y - start) / (end - start)));
        };
        window.addEventListener('scroll', onScroll);
        onScroll();
      }
    }
    setupScroll();

    // --- Animation loop --------------------------------------------------
    const temp = new THREE.Vector3();
    function animate() {
      requestAnimationFrame(animate);
      const posAttr = geometry.getAttribute('position');
      const targetAttr = geometry.getAttribute('target');
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3;
        const t = progress;
        temp.set(
          THREE.MathUtils.lerp(positions[ix], targets[ix], t),
          THREE.MathUtils.lerp(positions[ix + 1], targets[ix + 1], t),
          THREE.MathUtils.lerp(positions[ix + 2], targets[ix + 2], t)
        );
        posAttr.setXYZ(i, temp.x, temp.y, temp.z);
      }
      posAttr.needsUpdate = true;

      // reveal browser element
      const browser = document.querySelector('.assembly-browser');
      if (browser) {
        browser.style.opacity = progress;
        browser.style.transform = `translateY(${(1 - progress) * 50}px)`;
      }

      renderer.render(scene, camera);
    }
    animate();
  }
})();
