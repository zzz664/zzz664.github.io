import * as THREE from "three";

const textContainer = document.querySelector(".text-container");
let easeFactor = 0.02;
let camera, renderer, planeMesh;
let mousePosition = { x: 0, y: 0 };
let targetMousePosition = { x: 0, y: 0 };
let prevPosition = { x: 0, y: 0 };
let text = "HELLO THREE.JS";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const distortionFragment = `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec2 uMouse;
  uniform vec2 uPrevMouse;

  void main() {
    vec2 gridUv = floor(vUv * vec2(40.0, 40.0)) / vec2(40.0, 40.0);
    vec2 centerOfPixel = gridUv + vec2(1.0/80.0, 1.0/80.0);

    vec2 mouseDirection = uMouse - uPrevMouse;

    vec2 pixelToMouseDirection = centerOfPixel - uMouse;
    float pixelDistanceToMouse = length(pixelToMouseDirection);
    float strength = smoothstep(0.1, 0.0, pixelDistanceToMouse);

    vec2 uvOffset = strength * -mouseDirection * 0.3;
    vec2 uv = vUv - uvOffset;

    gl_FragColor = texture2D(uTexture, uv);
  }
`;

function createTextTexture(text, font, size, color, fontWeight = "100") {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const canvasWidth = window.innerWidth * 2;
  const canvasHeight = window.innerHeight * 2;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  ctx.fillStyle = color || "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const fontSize = size || Math.floor(canvasWidth * 2);

  ctx.fillStyle = "#1a1a1a";
  ctx.font = `${fontWeight} ${fontSize}px "${font || "Tilt Wrap"}"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;

  const scaleFactor = Math.min(1, (canvasWidth * 1) / textWidth);
  const aspectRatio = canvasWidth / canvasHeight;

  ctx.setTransform(
    scaleFactor,
    0,
    0,
    scaleFactor / aspectRatio,
    canvasWidth / 2,
    canvasHeight / 2,
  );

  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = fontSize * 0.005;
  for (let i = 0; i < 3; i++) {
    ctx.strokeText(text, 0, 0);
  }
  ctx.fillText(text, 0, 0);

  return new THREE.CanvasTexture(canvas);
}

const baseTexture = createTextTexture(text, "Tilt Wrap", 300, "#ffffff", "700");

const aspectRatio = window.innerWidth / window.innerHeight;
camera = new THREE.OrthographicCamera(
  -1,
  1,
  1 / aspectRatio,
  -1 / aspectRatio,
  0.1,
  1000,
);
camera.position.z = 1;

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

textContainer.appendChild(renderer.domElement);

let distortionMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader: distortionFragment,
  uniforms: {
    uTexture: { value: baseTexture },
    uMouse: { value: new THREE.Vector2() },
    uPrevMouse: { value: new THREE.Vector2() },
  },
});

planeMesh = new THREE.PlaneGeometry(2, 2);
const distortionQuad = new THREE.Mesh(planeMesh, distortionMaterial);

const distortionScene = new THREE.Scene();
distortionScene.add(distortionQuad);

function animateScene() {
  requestAnimationFrame(animateScene);

  mousePosition.x += (targetMousePosition.x - mousePosition.x) * easeFactor;
  mousePosition.y += (targetMousePosition.y - mousePosition.y) * easeFactor;

  const mouseVec = new THREE.Vector2(mousePosition.x, 1.0 - mousePosition.y);
  distortionMaterial.uniforms.uMouse.value.copy(mouseVec);
  distortionMaterial.uniforms.uPrevMouse.value.copy(prevPosition);

  renderer.render(distortionScene, camera);
}

animateScene();

textContainer.addEventListener("mousemove", handleMouseMove);
textContainer.addEventListener("mouseenter", handleMouseEnter);
textContainer.addEventListener("mouseleave", handleMouseLeave);

function handleMouseMove(event) {
  easeFactor = 0.04;
  let rect = textContainer.getBoundingClientRect();
  prevPosition = { ...targetMousePosition };

  targetMousePosition.x = (event.clientX - rect.left) / rect.width;
  targetMousePosition.y = (event.clientY - rect.top) / rect.height;
}

function handleMouseEnter(event) {
  easeFactor = 0.02;
  let rect = textContainer.getBoundingClientRect();

  mousePosition.x = targetMousePosition.x =
    (event.clientX - rect.left) / rect.width;
  mousePosition.y = targetMousePosition.y =
    (event.clientY - rect.top) / rect.height;
}

function handleMouseLeave(event) {
  easeFactor = 0.02;
  targetMousePosition = { ...prevPosition };
}
