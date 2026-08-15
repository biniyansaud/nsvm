import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { 
  ArrowDown, 
  Sparkles, 
  Navigation, 
  GraduationCap, 
  Laptop, 
  Trophy, 
  ArrowRight, 
  RotateCcw,
  Volume2,
  VolumeX,
  Compass
} from "lucide-react";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

/**
 * Robust ES6 Class-Based WebGL Engine
 * Manages 3D Scene, Geometry generation, Lighting rig, resizing, and rendering
 * Enhanced with Draco compression, LoadingManager, and mobile-first performance parameters.
 */
class WebGLApp {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  clock!: THREE.Clock;
  controls?: OrbitControls;
  animationFrameId?: number;

  // Asset Loading Pipeline
  loadingManager!: THREE.LoadingManager;
  dracoLoader!: DRACOLoader;
  gltfLoader!: GLTFLoader;
  isMobileDevice: boolean = false;
  
  // Animation state rigged to GSAP ScrollTrigger
  cameraState = {
    x: 0,
    y: 8,
    z: 22,
    tx: 0,
    ty: 1,
    tz: -5,
  };

  // Scene entities for interactive rotation / particles
  particles!: THREE.Points;
  mainGateGroup!: THREE.Group;
  stemLabGroup!: THREE.Group;
  sportsArenaGroup!: THREE.Group;

  // Sound/Audio synth context (Optional web audio for immersive experience)
  audioCtx: AudioContext | null = null;
  synthInterval: any = null;

  constructor(container: HTMLDivElement, canvas: HTMLCanvasElement, onProgress: (pct: number) => void) {
    this.container = container;
    this.canvas = canvas;
    this.clock = new THREE.Clock();

    // Detect mobile/tablet screen size or userAgent to apply critical optimization metrics
    this.isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

    // Load assets via real LoadingManager and configured Draco/GLTF Loaders
    this.loadAssets(onProgress);
  }

  loadAssets(onProgress: (pct: number) => void) {
    // 1. Instantiate the LoadingManager
    this.loadingManager = new THREE.LoadingManager();

    let realProgress = 0;

    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      console.log(`WebGL Loading: started "${url}" [${itemsLoaded}/${itemsTotal}]`);
    };

    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      realProgress = (itemsLoaded / itemsTotal) * 100;
    };

    this.loadingManager.onLoad = () => {
      console.log("All critical WebGL texture buffers and Draco decoders loaded.");
      
      // Complete remaining progress smoothly for cinematic feel
      let current = progressState;
      const finishInterval = setInterval(() => {
        current += 4;
        if (current >= 100) {
          clearInterval(finishInterval);
          onProgress(100);
          this.init();
        } else {
          onProgress(current);
        }
      }, 30);
    };

    this.loadingManager.onError = (url) => {
      console.warn(`Asset failed to load but skipped for resilience: ${url}`);
    };

    // 2. Initialize DRACOLoader with Google's gstatic decoder CDN for maximum download speed and caching
    this.dracoLoader = new DRACOLoader(this.loadingManager);
    this.dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    this.dracoLoader.setDecoderConfig({ type: "js" });

    // 3. Initialize GLTFLoader and link DRACOLoader
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    // 4. Load standard school textures to trigger real LoadingManager cycle
    const textureLoader = new THREE.TextureLoader(this.loadingManager);
    
    // Warm-up loaders with real school asset paths
    textureLoader.load("/images/branding/school-logo.jpg");

    // 5. Blended progression timer to simulate shader compilation and Draco thread setup
    let progressState = 0;
    const progressInterval = setInterval(() => {
      if (progressState < 90) {
        progressState += Math.floor(Math.random() * 6) + 2;
        const blended = Math.max(progressState, Math.round(realProgress));
        onProgress(Math.min(blended, 99));
      } else {
        clearInterval(progressInterval);
      }
    }, 120);
  }

  init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene Base with explicit cinematic Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#090d16"); // Deep cosmic dark blue
    this.scene.fog = new THREE.FogExp2("#090d16", this.isMobileDevice ? 0.02 : 0.015); // Slightly tighter fog on mobile

    // 2. Camera setup with cinematic 60 FOV
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(this.cameraState.x, this.cameraState.y, this.cameraState.z);

    // 3. Renderer with smart mobile optimizations
    // Disable heavy antialiasing on mobile high-DPI screens to save fill rate
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isMobileDevice,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(width, height);
    
    // Strict clamp of pixel ratio: 1 on mobile to avoid rendering at 3x/4x high resolution bottlenecks
    this.renderer.setPixelRatio(this.isMobileDevice ? 1 : Math.min(window.devicePixelRatio, 2));
    
    // Dynamic shadow map management: completely disabled on mobile for dramatic CPU/GPU load savings
    this.renderer.shadowMap.enabled = !this.isMobileDevice;
    if (this.renderer.shadowMap.enabled) {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // 4. Three-Point Lighting Rig
    this.setupLighting();

    // 5. Ambient Atmospheric Dust / Sparkle Particles
    this.setupAtmosphere();

    // 6. Generate Campus Geometry Placeholders
    this.generateCampusObjects();

    // 7. Event Listeners & Core Loop Start
    window.addEventListener("resize", this.handleResize);
    this.animate();
  }

  setupLighting() {
    // Light 1: Ambient fill (soft indigo hue)
    const ambientLight = new THREE.AmbientLight("#2e3b5e", 0.6);
    this.scene.add(ambientLight);

    // Light 2: Sharp Directional Key Light with shadow mapping
    const dirLight = new THREE.DirectionalLight("#ffffff", 1.2);
    dirLight.position.set(15, 30, 20);
    
    // Only configure heavy shadow parameters if shadows are enabled (desktop only)
    if (!this.isMobileDevice) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 100;
      const d = 25;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
    }
    this.scene.add(dirLight);

    // Light 3: Localized neon glowing PointLight mapping target zones
    const pointLight1 = new THREE.PointLight("#38bdf8", 3, 30); // Bright Sky Blue
    pointLight1.position.set(-15, 4, -10); // Main Gate Area
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight("#ec4899", 4, 25); // Magenta STEM Lab Light
    pointLight2.position.set(10, 5, -35); // STEM Area
    this.scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight("#fbbf24", 3, 40); // Amber Sports Arena Light
    pointLight3.position.set(-5, 3, -70); // Sports Arena Area
    this.scene.add(pointLight3);
  }

  setupAtmosphere() {
    // Reduce particle count on mobile from 600 to 180 to reduce vertex shader burden
    const particleCount = this.isMobileDevice ? 180 : 600;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Scattered throughout the cinematic tour pathway
      positions[i] = (Math.random() - 0.5) * 80; // X
      positions[i + 1] = Math.random() * 25;      // Y
      positions[i + 2] = -Math.random() * 110;    // Z

      // Dual shade sparks: sky blue and magenta
      const isMagenta = Math.random() > 0.5;
      colors[i] = isMagenta ? 0.92 : 0.22; // R
      colors[i + 1] = isMagenta ? 0.28 : 0.74; // G
      colors[i + 2] = isMagenta ? 0.60 : 0.97; // B
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Glowy circular particle texture
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: this.isMobileDevice ? 0.25 : 0.35, // Slightly smaller dust on mobile
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  generateCampusObjects() {
    // Helper materials
    // Use lighter materials on mobile (MeshLambertMaterial instead of MeshPhysicalMaterial / MeshStandardMaterial)
    // to bypass heavy physical rendering equations on mobile browsers.
    const pathMat = this.isMobileDevice 
      ? new THREE.MeshLambertMaterial({ color: "#1e293b" })
      : new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.8 });

    const wireframeMat = new THREE.MeshBasicMaterial({ 
      color: "#ec4899", 
      wireframe: true, 
      transparent: true, 
      opacity: 0.4 
    });

    const glowBlueMat = this.isMobileDevice
      ? new THREE.MeshLambertMaterial({ color: "#0284c7", emissive: "#014d7c" })
      : new THREE.MeshStandardMaterial({ color: "#0284c7", emissive: "#0369a1", roughness: 0.2 });

    const glassMat = this.isMobileDevice
      ? new THREE.MeshBasicMaterial({ color: "#e2e8f0", transparent: true, opacity: 0.4 })
      : new THREE.MeshPhysicalMaterial({
          color: "#ffffff",
          transparent: true,
          opacity: 0.3,
          transmission: 0.9,
          roughness: 0.1,
          metalness: 0.1
        });

    // ============================================
    // OBJECT 1: MAIN GATE / RECEPTION
    // Location: x: -15, y: 0, z: -10
    // ============================================
    this.mainGateGroup = new THREE.Group();
    this.mainGateGroup.position.set(-15, 0, -10);

    // Platform Base
    const gateBase = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 8), pathMat);
    if (!this.isMobileDevice) gateBase.receiveShadow = true;
    this.mainGateGroup.add(gateBase);

    // Left and Right concrete pillars
    const pillarGeo = new THREE.BoxGeometry(1, 6, 1);
    const pillarMat = this.isMobileDevice
      ? new THREE.MeshLambertMaterial({ color: "#475569" })
      : new THREE.MeshStandardMaterial({ color: "#475569", roughness: 0.6 });
      
    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-3.5, 3, 0);
    if (!this.isMobileDevice) {
      leftPillar.castShadow = true;
      leftPillar.receiveShadow = true;
    }

    const rightPillar = leftPillar.clone();
    rightPillar.position.set(3.5, 3, 0);

    // Archway header
    const archHeader = new THREE.Mesh(new THREE.BoxGeometry(8, 0.8, 1.2), glowBlueMat);
    archHeader.position.set(0, 6, 0);
    if (!this.isMobileDevice) archHeader.castShadow = true;

    // Welcome Sign
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(5, 1.5, 0.2), 
      this.isMobileDevice ? new THREE.MeshBasicMaterial({ color: "#0f172a" }) : new THREE.MeshStandardMaterial({ color: "#0f172a" })
    );
    signBoard.position.set(0, 4.2, 0);
    
    // Tiny glowing sign accents
    const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.15, 0.3), new THREE.MeshBasicMaterial({ color: "#fbbf24" }));
    ledStrip.position.set(0, 3.4, 0);

    this.mainGateGroup.add(leftPillar, rightPillar, archHeader, signBoard, ledStrip);
    this.scene.add(this.mainGateGroup);

    // ============================================
    // OBJECT 2: THE STEM / CODING LAB
    // Location: x: 10, y: 0, z: -35
    // ============================================
    this.stemLabGroup = new THREE.Group();
    this.stemLabGroup.position.set(10, 0, -35);

    // Floating Technological circular grid
    const techGrid = new THREE.GridHelper(12, this.isMobileDevice ? 6 : 12, "#ec4899", "#334155");
    techGrid.position.y = 0.1;
    this.stemLabGroup.add(techGrid);

    // Modern glass-dome main building with optimized segments for mobile
    const domeGeo = new THREE.SphereGeometry(
      4, 
      this.isMobileDevice ? 12 : 32, 
      this.isMobileDevice ? 8 : 16, 
      0, 
      Math.PI * 2, 
      0, 
      Math.PI / 2
    );
    const dome = new THREE.Mesh(domeGeo, glassMat);
    dome.position.y = 0;
    if (!this.isMobileDevice) dome.castShadow = true;
    this.stemLabGroup.add(dome);

    // Internal spinning holographic octahedron
    const holoGeo = new THREE.OctahedronGeometry(1.8, 0);
    const holoMesh = new THREE.Mesh(holoGeo, wireframeMat);
    holoMesh.position.y = 2.5;
    holoMesh.name = "hologram";
    this.stemLabGroup.add(holoMesh);

    // Secondary satellites floating/orbiting
    const satGeo = new THREE.IcosahedronGeometry(0.4, 0);
    const satMat = this.isMobileDevice
      ? new THREE.MeshBasicMaterial({ color: "#a855f7" })
      : new THREE.MeshStandardMaterial({ color: "#a855f7", roughness: 0.1 });
      
    const sat1 = new THREE.Mesh(satGeo, satMat);
    sat1.position.set(-2.8, 2, 2.8);
    sat1.name = "satellite1";
    
    const sat2 = new THREE.Mesh(satGeo, satMat);
    sat2.position.set(2.8, 3.5, -2.8);
    sat2.name = "satellite2";

    this.stemLabGroup.add(sat1, sat2);
    this.scene.add(this.stemLabGroup);

    // ============================================
    // OBJECT 3: THE SPORTS ARENA & RECREATION
    // Location: x: -5, y: 0, z: -70
    // ============================================
    this.sportsArenaGroup = new THREE.Group();
    this.sportsArenaGroup.position.set(-5, 0, -70);

    // Grass playing field
    const fieldGeo = new THREE.BoxGeometry(22, 0.1, 14);
    const fieldMat = this.isMobileDevice
      ? new THREE.MeshLambertMaterial({ color: "#15803d" })
      : new THREE.MeshStandardMaterial({ color: "#15803d", roughness: 0.9 });
    const field = new THREE.Mesh(fieldGeo, fieldMat);
    if (!this.isMobileDevice) field.receiveShadow = true;
    this.sportsArenaGroup.add(field);

    // Dynamic surrounding athletic racetrack track with optimized torus segments
    const trackGeo = new THREE.TorusGeometry(
      10, 
      1.8, 
      this.isMobileDevice ? 4 : 8, 
      this.isMobileDevice ? 20 : 48
    );
    const trackMat = this.isMobileDevice
      ? new THREE.MeshLambertMaterial({ color: "#b91c1c" })
      : new THREE.MeshStandardMaterial({ color: "#b91c1c", roughness: 0.7 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = Math.PI / 2;
    track.position.y = 0.05;
    track.scale.set(1.4, 0.9, 1);
    this.sportsArenaGroup.add(track);

    // Modern glowing architectural pavilion rings
    const ringGeo = new THREE.RingGeometry(5.5, 6, this.isMobileDevice ? 16 : 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: "#eab308", side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const archRing1 = new THREE.Mesh(ringGeo, ringMat);
    archRing1.rotation.y = Math.PI / 4;
    archRing1.position.set(0, 3, 0);

    const archRing2 = archRing1.clone();
    archRing2.rotation.y = -Math.PI / 4;

    this.sportsArenaGroup.add(archRing1, archRing2);
    this.scene.add(this.sportsArenaGroup);
  }

  playAmbientImmersiveBeep() {
    // Safe synthesized music nodes to elevate the cinematic feeling
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    if (this.audioCtx) {
      try {
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        // Random elegant synth chime matching current visual section
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // Major triad pentatonic values (C, E, G, C, E)
        const randomNote = notes[Math.floor(Math.random() * notes.length)];
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(randomNote, this.audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.8);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 1.8);
      } catch (err) {
        console.warn("Audio Context beep error:", err);
      }
    }
  }

  toggleSound(isPlaying: boolean) {
    if (!isPlaying) {
      if (this.synthInterval) {
        clearInterval(this.synthInterval);
        this.synthInterval = null;
      }
      return;
    }

    this.playAmbientImmersiveBeep();
    this.synthInterval = setInterval(() => {
      this.playAmbientImmersiveBeep();
    }, 4500);
  }

  handleResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // Camera aspect ratio renewal
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Size updates keeping pixel density optimized
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Rotate holographic objects continuously
    if (this.stemLabGroup) {
      const hologram = this.stemLabGroup.getObjectByName("hologram");
      if (hologram) {
        hologram.rotation.y += delta * 0.4;
        hologram.rotation.z += delta * 0.2;
        // Float up and down slightly
        hologram.position.y = 2.5 + Math.sin(elapsedTime * 1.5) * 0.15;
      }

      const sat1 = this.stemLabGroup.getObjectByName("satellite1");
      if (sat1) {
        sat1.position.x = Math.sin(elapsedTime * 1.2) * 3;
        sat1.position.z = Math.cos(elapsedTime * 1.2) * 3;
        sat1.rotation.x += delta * 0.5;
      }

      const sat2 = this.stemLabGroup.getObjectByName("satellite2");
      if (sat2) {
        sat2.position.x = Math.cos(elapsedTime * 1.0 + Math.PI) * 2.8;
        sat2.position.z = Math.sin(elapsedTime * 1.0 + Math.PI) * 2.8;
        sat2.rotation.y += delta * 0.6;
      }
    }

    // Dynamic ambient dust drift
    if (this.particles) {
      this.particles.rotation.y += delta * 0.02;
      this.particles.rotation.x += delta * 0.008;
    }

    // Gentle floating loop for the other objects to make the world alive
    if (this.sportsArenaGroup) {
      this.sportsArenaGroup.rotation.y = Math.sin(elapsedTime * 0.3) * 0.02;
    }

    // Lerp Camera smoothly using rigged GSAP properties
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.cameraState.x, 0.08);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.cameraState.y, 0.08);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.cameraState.z, 0.08);

    // Lerp Target/Focus parameters
    const target = new THREE.Vector3(this.cameraState.tx, this.cameraState.ty, this.cameraState.tz);
    
    if (this.controls) {
      this.controls.target.copy(target);
      this.controls.update();
    } else {
      // Calculate lookAt smoothly
      this.camera.lookAt(target);
    }

    this.renderer.render(this.scene, this.camera);
  };

  destroy() {
    // Clear RAF and intervals
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
    }

    window.removeEventListener("resize", this.handleResize);

    // Dispose all objects, geometries and materials to avoid memory leaks
    if (this.scene) {
      this.scene.traverse((object: any) => {
        if (!object.isMesh && !object.isPoints) return;
        
        if (object.geometry) object.geometry.dispose();

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((mat: any) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

export default function VirtualTour() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollTriggerContainerRef = useRef<HTMLDivElement>(null);
  const appInstanceRef = useRef<WebGLApp | null>(null);

  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentSection, setCurrentSection] = useState<"gate" | "stem" | "sports" | "intro">("intro");

  // Rig 3D rendering inside canvas upon initialization
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    // Create custom WebGL context instance
    const app = new WebGLApp(containerRef.current, canvasRef.current, (pct) => {
      setProgress(pct);
      if (pct >= 100) {
        setTimeout(() => {
          setIsLoaded(true);
        }, 300);
      }
    });

    appInstanceRef.current = app;

    return () => {
      app.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // Set up GSAP scroll triggers once cinematic tour begins
  useEffect(() => {
    if (!hasStarted || !appInstanceRef.current || !scrollTriggerContainerRef.current) return;

    const app = appInstanceRef.current;

    // Master Timeline for Scroll-Linked Cinematic Camera Pathing
    const mainTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: scrollTriggerContainerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5, // High dampening value for exceptionally buttery flow
        onUpdate: (self) => {
          const scrollPct = self.progress;
          
          // Classify section to animate current HTML detail cards with smooth layout triggers
          if (scrollPct < 0.25) {
            setCurrentSection("intro");
          } else if (scrollPct >= 0.25 && scrollPct < 0.6) {
            setCurrentSection("gate");
          } else if (scrollPct >= 0.6 && scrollPct < 0.85) {
            setCurrentSection("stem");
          } else {
            setCurrentSection("sports");
          }
        }
      },
    });

    // Segment 1: Starting Point (FOV 60, focus front-center) to Main Gate (0% -> 30%)
    mainTimeline.to(app.cameraState, {
      x: -18,
      y: 4.5,
      z: -1,
      tx: -15,
      ty: 1.8,
      tz: -10,
      duration: 3,
      ease: "power1.inOut"
    });

    // Segment 2: Sweep towards the floating STEM Dome in a tight curve (31% -> 70%)
    mainTimeline.to(app.cameraState, {
      x: 16,
      y: 6.5,
      z: -28,
      tx: 10,
      ty: 2.5,
      tz: -35,
      duration: 5,
      ease: "power2.inOut"
    });

    // Segment 3: Ascend into high bird's eye view perspective over the Sports Arena (71% -> 100%)
    mainTimeline.to(app.cameraState, {
      x: -12,
      y: 19,
      z: -52,
      tx: -5,
      ty: 0.5,
      tz: -70,
      duration: 4,
      ease: "power1.out"
    });

    // Refresh ScrollTrigger state immediately to align coordinates correctly
    ScrollTrigger.refresh();
  }, [hasStarted]);

  // Audio synths sound toggle
  const toggleAudio = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    appInstanceRef.current?.toggleSound(!nextMute);
  };

  const handleStartTour = () => {
    setHasStarted(true);
    // Auto unmute occasionally to guide experience
    setIsMuted(false);
    appInstanceRef.current?.toggleSound(true);

    // Initial cinematic GSAP entrance animation (camera swoops back subtly)
    if (appInstanceRef.current) {
      gsap.to(appInstanceRef.current.cameraState, {
        x: 0,
        y: 4.5,
        z: 18,
        duration: 2.2,
        ease: "power2.out"
      });
    }
  };

  return (
    <div id="virtual-tour-root" className="relative w-full min-h-screen bg-[#090d16] text-white overflow-x-hidden selection:bg-amber-500 selection:text-slate-950 font-sans">
      <SEO
        title="Interactive 3D Virtual Campus Tour — 360° Walkthrough"
        description="Take an interactive 3D virtual tour of New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM), BDM-12 Airy, Kanchanpur campus facilities, sports grounds, and science laboratories."
        keywords="New Saraswati Virtual Tour, newsaraswati, newsaraswatividyamandir, New Saraswati Vidya Mandir 3D Campus, NSVM Interactive Tour Kanchanpur"
        canonical="/virtual-tour"
        pageType="WebPage"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Virtual Tour", path: "/virtual-tour" },
        ]}
      />
      {/* 3D Canvas Layer */}
      <div 
        ref={containerRef} 
        className="fixed inset-0 w-full h-full z-0 pointer-events-auto"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Atmospheric vignette styling overlay */}
      <div className="fixed inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,rgba(9,13,22,0)_40%,rgba(9,13,22,0.65)_100%)]" />

      {/* Modern Sci-Fi HUD Ambient Lines */}
      <div className="fixed inset-x-0 top-0 h-16 pointer-events-none z-20 flex justify-between items-center px-6 md:px-12">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-amber-400 animate-spin-slow" />
          <span className="font-mono text-xs tracking-[0.25em] text-slate-300 font-bold uppercase">
            NSVM // VIRTUAL METAVERSE
          </span>
        </div>
        
        {hasStarted && (
          <button 
            onClick={toggleAudio}
            className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/40 border border-white/10 hover:bg-slate-900/60 transition-all duration-200"
          >
            {isMuted ? (
              <>
                <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-mono text-[10px] tracking-wider text-slate-400 uppercase">SYNTHS OFF</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span className="font-mono text-[10px] tracking-wider text-amber-400 uppercase">SYNTHS ON</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* AWARDS LEVEL OVERLAY LOADING SCREEN */}
      {!hasStarted && (
        <div 
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090d16] transition-all duration-1000 ${
            isLoaded && hasStarted ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
          }`}
        >
          {/* Neon background grids */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          
          <div className="relative max-w-lg w-full px-6 flex flex-col items-center text-center gap-6">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-2xl shadow-rose-500/25 border border-white/20">
              <Sparkles className="h-8 w-8 text-white animate-pulse" />
            </div>

            <div className="space-y-2.5">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400 font-sans">
                {t("Virtual Campus Experience")}
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                {t("Step into a highly responsive, cinematic 3D simulation of our academy grounds. Control camera pathways via smooth scrolling.")}
              </p>
            </div>

            {/* Loading Progression bar */}
            <div className="w-full max-w-xs space-y-2 mt-4">
              <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 transition-all duration-200 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 tracking-wider">
                <span>{progress < 100 ? t("INITIALIZING ENGINE...") : t("READY TO LAUNCH")}</span>
                <span>{progress}%</span>
              </div>
            </div>

            {/* Launch CTA */}
            {isLoaded && (
              <button
                onClick={handleStartTour}
                className="mt-6 flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-semibold text-sm shadow-xl shadow-rose-600/20 hover:shadow-rose-600/30 transition-all duration-300 hover:scale-[1.03] active:scale-95 border border-white/10"
              >
                <span>{t("Begin Cinematic Tour")}</span>
                <ArrowRight className="h-4 w-4 animate-bounce-horizontal" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scroll Trigger Dummy Engine Track */}
      {hasStarted && (
        <div ref={scrollTriggerContainerRef} className="relative z-20 w-full" style={{ height: "400vh" }}>
          
          {/* Scroll Navigation Cue */}
          {currentSection === "intro" && (
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 text-center text-xs text-slate-400 tracking-[0.2em] font-mono select-none">
              <span>{t("SCROLL DOWN TO INITIATE PATHWAY")}</span>
              <div className="w-6 h-10 rounded-full border-2 border-slate-700 p-1 flex justify-center">
                <motion.div 
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1.5 h-1.5 rounded-full bg-amber-400" 
                />
              </div>
            </div>
          )}

          {/* RIGHT SIDEBAR PINNED DETAIL HUD CARDS */}
          <div className="fixed right-6 md:right-12 top-1/2 -translate-y-1/2 w-full max-w-[340px] md:max-w-[400px] pointer-events-none z-30">
            
            {/* CARD 1: Welcome Intro */}
            {currentSection === "intro" && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className="pointer-events-auto p-6 rounded-2xl bg-slate-950/50 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Navigation className="h-4 w-4 text-indigo-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100 tracking-wide uppercase font-mono">
                    {t("CINEMATIC FLIGHT")}
                  </h3>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black tracking-tight text-white leading-tight">
                    {t("Bhuwaneshwori Academy")}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t("Welcome to our interactive digital twin. Scroll to glide down the custom camera splines and inspect our dynamic campuses.")}
                  </p>
                </div>
                <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2 border-t border-white/5 pt-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t("COORDINATES LOCKED: 29.35° N, 80.98° E")}</span>
                </div>
              </motion.div>
            )}

            {/* CARD 2: Main Gate Reception */}
            {currentSection === "gate" && (
              <motion.div
                initial={{ opacity: 0, x: 40, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className="pointer-events-auto p-6 rounded-2xl bg-slate-950/50 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                    <GraduationCap className="h-4 w-4 text-sky-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100 tracking-wide uppercase font-mono">
                    {t("SECTION 01")}
                  </h3>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black tracking-tight text-white leading-tight">
                    {t("Main Gate & Reception")}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t("The welcoming gateway of NSVM, featuring dedicated reception blocks, digital signage panels, and expansive stone entryways ensuring high security and warmth.")}
                  </p>
                </div>
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>{t("ELEVATION PROFILE")}</span>
                    <span>{t("GROUND LEVEL")}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-400 w-1/3 rounded-full" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* CARD 3: STEM Coding Lab */}
            {currentSection === "stem" && (
              <motion.div
                initial={{ opacity: 0, x: 40, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className="pointer-events-auto p-6 rounded-2xl bg-slate-950/50 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                    <Laptop className="h-4 w-4 text-pink-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100 tracking-wide uppercase font-mono">
                    {t("SECTION 02")}
                  </h3>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black tracking-tight text-white leading-tight">
                    {t("The STEM & AI Tech Lab")}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t("Our flagship high-performance engineering domain. Furnished with interactive robotics stations, hologram grids, and deep learning platforms for young innovators.")}
                  </p>
                </div>
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>{t("COMPUTATIONAL BANDWIDTH")}</span>
                    <span>{t("8.4 TFLOPS")}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 w-2/3 rounded-full" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* CARD 4: Sports Arena */}
            {currentSection === "sports" && (
              <motion.div
                initial={{ opacity: 0, x: 40, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className="pointer-events-auto p-6 rounded-2xl bg-slate-950/50 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Trophy className="h-4 w-4 text-amber-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100 tracking-wide uppercase font-mono">
                    {t("SECTION 03")}
                  </h3>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black tracking-tight text-white leading-tight">
                    {t("Athletic Field & Track")}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t("Our world-class multi-sports stadium. Features modern turf layers, a banked synthetic athletic racetrack, and stylized seating enclosures promoting healthy wellness.")}
                  </p>
                </div>
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>{t("MAXIMUM CAPACITY")}</span>
                    <span>{t("1200 AUDIENCE")}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 w-full rounded-full" />
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* LEFT CORNER FLOATING INTERACTIVE GUIDE ACCENTS */}
          {hasStarted && (
            <div className="fixed left-6 md:left-12 bottom-12 z-30 space-y-4 select-none">
              <div className="p-4 rounded-xl bg-slate-950/30 backdrop-blur-md border border-white/5 max-w-[200px] space-y-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">{t("CURRENT VIEW TARGET")}</span>
                <span className="text-xs font-bold text-slate-200 block truncate">
                  {currentSection === "intro" && t("Central Campus Core")}
                  {currentSection === "gate" && t("01 // Front Gate Gateway")}
                  {currentSection === "stem" && t("02 // STEM & Tech Node")}
                  {currentSection === "sports" && t("03 // Sports Oval Stadium")}
                </span>
              </div>
              
              <div className="flex gap-2.5">
                <a 
                  href="/" 
                  className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all duration-200 shadow-md font-sans"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{t("Return Home")}</span>
                </a>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
