import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader.js";
import {gsap} from "gsap";
import html2canvas from "html2canvas";

const projectType = {
  PROGRAMMING: "programming",
  TECHNICAL_ART: "technicalArt",
  ART: "3D"
};
let iconParameters = [
  [projectType.PROGRAMMING, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/KineticRush4.webm", "Kinetic Rush", "A running-themed community challenge", ["blender", "css", "photoshop"]],
  [projectType.TECHNICAL_ART, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/ChasmsCall4.webm", "Project 2", "Description 2", ["blender", "js"]],
  [projectType.ART, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/ChasmsCall4.webm", "Project 3", "Description 3", ["aftereffects"]],
  [projectType.PROGRAMMING, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/ChasmsCall4.webm", "Project 4", "Description 4", ["css"]]
];

//CONSTANTS
//region
//VERY IMPORTANT
const BAKE_ICON_OVERLAY = false;
printDebug(BAKE_ICON_OVERLAY ? "Baking textures..." : "Skipped baking textures!");

//const mobileUser = "ontouchstart" in window || navigator.maxTouchPoints > 0;
const mobileUser = false;
const MAIN_COLOR = {
  r: 67,
  g: 59,
  b: 255
}
const MAIN_COLOR_NORMALIZED = new THREE.Color(0x9EDFFF);
const MAGIC_DIV_OFFSET = 0.96;
const DEFAULT_FONT_SIZE = 10;
const ICON_GROUP_SPAWNER_INITIAL_POSITION = new THREE.Vector3(0.15, 0.36, 0);
const ICON_GAP_HORIZONTAL = 0.15;
const ICON_GAP_VERTICAL = ICON_GAP_HORIZONTAL;
const ICON_SCALE = 1.35;
const ICON_ROTATION = 0;
//endregion

//THREE JS SETUP
//region
const scene = new THREE.Scene();
const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight
};
const camera = new THREE.PerspectiveCamera( 35.98339890412515, screenSize.width / screenSize.height, 0.01, 1000);
camera.rotation.order = 'YXZ';
camera.position.x = 0;
camera.position.y = 0.25;
camera.position.z = -1;
camera.rotation.x = Math.PI * -5 / 180;
camera.rotation.y = Math.PI;
const cameraWrapper = {
  camera: camera,
  centeredDiv: document.querySelector(".CenteredDiv"),
  scrollDiv: document.querySelector(".ScrollDiv"),
  faceForegroundImage: document.querySelector(".FaceForegroundImage")
};
const canvas = document.querySelector(".threejs");
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true
});
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(render);
const loaderManager = new THREE.LoadingManager(() => {
  if (!mobileUser) {
    renderer.compile(scene, camera);
    gsap.set(".LoadingIcon", {opacity: 0, overwrite: "auto"});
    onLoad();
    printDebug("Finished loading");
  }
  else {
    gsap.set(".MobileDiv", {opacity: 1, overwrite: "auto"});
    document.querySelector(".MobileButtonDiv").addEventListener("click", () => {
      window.open("https://www.instagram.com/kubawalczak005/");
    })
  }
})
camera.updateProjectionMatrix();
scene.updateMatrixWorld(true);

//SETUP TEXTURE LOADER
const textureLoader = new THREE.TextureLoader(loaderManager);

//SETUP MODEL LOADER
//region
const loader = new GLTFLoader(loaderManager);
const dracoLoader = new DRACOLoader(loaderManager);
dracoLoader.setDecoderPath("/draco/");
loader.setDRACOLoader(dracoLoader);
//endregion

//LOAD CUSTOM TEXTURES
//region
const cubeMap = new THREE.CubeTextureLoader().setPath("https://PortfolioPullZone.b-cdn.net/LandingPage/Textures/").load(["CubeMap.webp", "CubeMap.webp", "CubeMap.webp", "CubeMap.webp", "CubeMap.webp", "CubeMap.webp"]);

const textureBake = textureLoader.load("Bake.png", (textureBake) => {
  textureBake.flipY = false;
  textureBake.colorSpace = THREE.SRGBColorSpace;
  textureBake.minFilter = THREE.LinearFilter;
  textureBake.magFilter = THREE.LinearFilter;
});
for (const parameters of iconParameters) {
  parameters.push(textureLoader.load(`LandingPage/Textures/${parameters[2]}.png`, (texture) => {
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }));
}

const glassMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  envMap: cubeMap,
  combine: THREE.MultiplyOperation,
  reflectivity: 1,
  transparent: true,
  opacity: 0.6,
});
//endregion

//SCENE
//region
//CREATE SCENE VARIABLES
let root = new THREE.Group();
let cube = null;
let laptopBase = null;
let laptopHinge = new THREE.Group();
let laptopDisplay = null;
let laptopScreen = null;

//SPAWN SCENE (static, no raycast)
loader.load("LandingPage/Models/Scene.glb", (glb) => {
  glb.scene.traverse((child) => {
    switch (true) {
      case child.name === "Root":
        root = child;
        break;
      case child.name === "Cube":
        child.material = new THREE.MeshBasicMaterial({map: textureBake});
        cube = child;
        break;
      case child.name === "LaptopBase":
        child.material = new THREE.MeshBasicMaterial({map: textureBake});
        laptopBase = child;
        break;
      case child.name === "LaptopHinge":
        laptopHinge = child;
        break;
      case child.name === "LaptopDisplay":
        child.material = new THREE.MeshBasicMaterial({map: textureBake});
        laptopDisplay = child;
        break;
      case child.name === "LaptopScreen":
        laptopScreen = child;
        break;
    }
  });
  scene.add(glb.scene);
});
//endregion

//ASSETS
//region
//CREATE ASSET VARIABLES (manually created and placed, raycast enabled)
let iconComponentGroup = new THREE.Group();
let raycastTargetArray = [];
let primitiveArray = [];
let iconArray = [];
let iconGroupGroup = new THREE.Group();
const h2cTags = {
  html: document.querySelector(".h2cHTMLDiv"),
  css: document.querySelector(".h2cCSSDiv"),
  js: document.querySelector(".h2cJSDiv"),
  threejs: document.querySelector(".h2cTHREEJSDiv"),
  java: document.querySelector(".h2cJAVADiv"),
  cpp: document.querySelector(".h2cCPPDiv"),
  blender: document.querySelector(".h2cBLENDERDiv"),
  aftereffects: document.querySelector(".h2cAFTEREFFECTSDiv"),
  premierepro: document.querySelector(".h2cPREMIEREPRODiv"),
  photoshop: document.querySelector(".h2cPHOTOSHOPDiv")
};
Object.values(h2cTags).forEach((tag) => {
  tag.style.opacity = 0;
});

//SPAWN ASSETS
loader.load("LandingPage/Models/AssetsCompressed.glb", (glb) => {
  glb.scene.traverse((child) => {
    switch (true) {
      case child.name === "IconGroup":
        iconComponentGroup = child;
        break;
      case child.name.includes("IconFrame"):
        child.material = glassMaterial;
        break;
      case child.name === "IconGlass":
        child.material = glassMaterial;
        break;
      case child.name === "IconHitbox":
        child.material = new THREE.MeshBasicMaterial({visible: false});
        break;
      case child.name === "Wireframe1":
        child.material = new THREE.MeshBasicMaterial({color: MAIN_COLOR_NORMALIZED, opacity: 0.05, transparent: true});
        for (let i = 0; i < 5; ++i) {
          const clone = child.clone();
          primitiveArray.push(clone);
        }
        break;
      case child.name === "IconScreen":
        //material assigned at icon creation
        break;
    }
  });

  //SETUP ASSETS
  if (!mobileUser) {
    loadIcons(iconParameters).then(() => {spawnIcons(true); removeIcons();});
  }

  primitiveArray.forEach((primitive) => {
    if (Math.random() > 0.8)
      randomizePosition(primitive, -0.1, 0.1, -1, 0.5,0.1, 0.2);
    else
      randomizePosition(primitive, -0.1, 0.1, -1, 0.5,0.1, 0.2);
    ambientAnimation(primitive);
    scene.add(primitive);
  });
});
//endregion

//UTILITY
//region
let lastFrameTime = performance.now();
let fps = null;

let finishedLoading = false;

const activeFilters = {
  PROGRAMMING: false,
  TECHNICAL_ART: false,
  ART: false
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let mouseDown = false;
let dragging = null;
let offset = new THREE.Vector3();
let plane = new THREE.Plane();
let intersection = new THREE.Vector3();
const lookPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.3);
const lookIntersection = new THREE.Vector3();
let raycastResult = null;
let previousRaycastResult = null;
let userLock = true;
let animationLock = null;

let divPositionMultiplier = null;

let DOMHover = null;
let portfolioButtonActive = true;

let filterButtonsActive = false;

let monitorPowered = true;
let monitorDivHover = false;
let monitorActive = false;
let scrollingDiscovered = false;
let scrollShowInterval = null;

const backgroundVideo = document.querySelector(".BackgroundVideo");
const backgroundCanvas1 = document.querySelector(".BackgroundCanvas1");
const backgroundCanvas2 = document.querySelector(".BackgroundCanvas2");
[backgroundCanvas1, backgroundCanvas2].forEach(canvas => {
  canvas.width = 1000;
  canvas.height = 2560;
});
//endregion

function render() {

  if (finishedLoading) {
    [backgroundCanvas1, backgroundCanvas2].forEach((canvas) => {
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      canvas.getContext("2d").drawImage(backgroundVideo, 0, 0, canvas.width, canvas.height);
    });
  }

  if (!userLock) {
    raycaster.setFromCamera(pointer, camera);
    const raycast = raycaster.intersectObjects(raycastTargetArray, true);
    if (raycast.length) {
      raycastResult = raycast[0].object;
      switch (true) {
        case raycastResult.parent.name === "IconGroup" && (raycastResult.parent === dragging || !dragging):
          const targetMatrix = new THREE.Matrix4().lookAt(raycastResult.parent.position, getMouseWorldPosition(), raycastResult.parent.up);
          targetMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
          targetMatrix.multiply(new THREE.Matrix4().makeRotationX(-ICON_ROTATION));
          const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(targetMatrix);
          gsap.to(raycastResult.parent.quaternion, {x: targetQuaternion.x, y: targetQuaternion.y, z: targetQuaternion.z, w: targetQuaternion.w, duration: 0.5});
          break;
      }
    }
    else if (!mouseDown && previousRaycastResult) {
      document.body.style.cursor = "default";
      raycastResult = null;
    }
    if (raycastResult !== previousRaycastResult && !mouseDown) {

      if (previousRaycastResult) {
        switch (true) {
          case previousRaycastResult.name === "IconHitbox" && previousRaycastResult !== animationLock:
            const iconGroup = previousRaycastResult.parent;
            const tempTl = iconGroup.userData.tl;
            if (tempTl && tempTl.time() >= tempTl.labels["selected"])
              animationLock = previousRaycastResult;
            if (iconGroup.userData.tl && iconGroup.userData.tl.isActive()) {
              iconGroup.userData.tl.kill();
            }
            const tl = gsap.timeline();
            iconGroup.userData.tl = tl;
            tl.to(iconGroup.scale, {x: ICON_SCALE, y: ICON_SCALE, z: 1, duration: 0.5, overwrite: "auto"})
            .to(iconGroup.userData.iconHover.material, {opacity: 0, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.repeat, {x: iconGroup.userData.screenTextureRepeatX, y: 1, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.offset, {x: iconGroup.userData.screenTextureOffsetX, y: 0, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.rotation, {x:ICON_ROTATION, y: 0, z: 0, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material, {opacity: 0.5, duration: 0.5, overwrite: "auto"}, "<").call(() => {
              animationLock = null;
            }, null, ">")
            .to(iconGroup.userData.iconOverlay.material, {opacity: 1, duration: 1, overwrite: "auto"}, "<")
            .to(iconGroup.position, {z: iconGroup.userData.originalPosition.z, duration: 0.5, overwrite: "auto"}, "<");
            break;
          case previousRaycastResult.name === "MonitorButton" && monitorPowered:
            gsap.to(monitorButton.material.color, {r: MAIN_COLOR_NORMALIZED.r, g: MAIN_COLOR_NORMALIZED.g, b: MAIN_COLOR_NORMALIZED.b, duration: 1, overwrite: "auto"});
            break;
        }
      }

      if (raycastResult) {
        switch (true) {
          case raycastResult.name === "IconHitbox" && raycastResult === animationLock:
            document.body.style.cursor = "grab";
            break;
          case raycastResult.parent.name === "IconGroup" && raycastResult.parent !== animationLock:
            document.body.style.cursor = "grab";
            const iconGroup = raycastResult.parent;
            if (iconGroup.userData.tl && iconGroup.userData.tl.isActive())
              iconGroup.userData.tl.kill();
            const tl = gsap.timeline();
            iconGroup.userData.tl = tl;
            tl.to(iconGroup.userData.iconHover.material, {opacity: 1, duration: 0.25, overwrite: "auto"}).addLabel("selected").call(() => {
            })
            .to(iconGroup.position, {z: -0.15, duration: 0.5, overwrite: "auto"}, ">")
            .to(iconGroup.userData.iconScreen.material, {opacity: 1, duration: 1, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconOverlay.material, {opacity: 0, duration: 0.1, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconHover.material, {opacity: 0, duration: 0.1, overwrite: "auto"}, "<")
            .to(iconGroup.scale, {x: ICON_SCALE * iconGroup.userData.aspectRatio, duration: 1, overwrite: "auto"}, ">")
            .to(iconGroup.userData.iconScreen.material.map.repeat, {x: 1, y: 1, duration: 1, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.offset, {x: 0, y: 0, duration: 1, overwrite: "auto"}, "<");
            break;
          case raycastResult.name === "MonitorButton":
            document.body.style.cursor = "pointer";
            if (monitorPowered) {
              const color2 = new THREE.Color(0xff0000);
              gsap.to(monitorButton.material.color, {r: color2.r, g: color2.g, b: color2.b, duration: 0.2, overwrite: "auto"});
            }
            break;
        }
      }
    }
    previousRaycastResult = raycastResult;
  }

  const now = performance.now();
  const delta = (now - lastFrameTime) / 1000;
  fps = 1 / delta;
  lastFrameTime = now;
  gsap.set(".Debug1", {innerHTML: `fps ${Math.floor(fps)}` +
  `<br>DOMHover ${DOMHover ? DOMHover.className : DOMHover}` +
  `<br>raycastResult ${raycastResult ? `${raycastResult.name} ${raycastResult.id}` : raycastResult}` +
  `<br>previousRaycastResult ${previousRaycastResult ? `${previousRaycastResult.name} ${previousRaycastResult.id}` : previousRaycastResult}` +
  `<br>animationLock ${animationLock ? `${animationLock.name} ${animationLock.id}` : animationLock}` +
  `<br>userLock ${userLock}`});

  renderer.render(scene, camera);

}

//END OF THREE JS SETUP
//endregion

/*window.addEventListener("wheel", (event) => {
  if (!userLock)
    if (monitorDivHover && monitorPowered && monitorActive) {
      scrollMonitorBy(event.deltaY * 0.2, 0.5, true)
    }
    else
      scrollCameraBy(event.deltaY * 0.0009, 0.5);
});*/

window.addEventListener("mousemove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("mousedown", (event) => {
  event.preventDefault();
  if (!userLock) {
    mouseDown = true;

    switch (true) {
      case DOMHover === document.querySelector(".MainButton"): {
        monitorState(false);
        let buttonGroup = null;
        switch (DOMHover) {
          case document.querySelector(".Button1"):{
            buttonGroup = ".HomeGroup";
            gsap.to(root.position, {y: 0, duration: 1, overwrite: "auto"});
            gsap.to(camera.position, {x: -0.35, y: 0.25, z: -1.2, duration: 1, overwrite: "auto"});
            gsap.to(camera.rotation, {y: Math.PI * 210 / 180, duration: 1, overwrite: "auto"});
            gsap.to(laptopHinge.rotation, {x: Math.PI * 115 / 180, duration: 1, overwrite: "auto"});
            removeIcons();
            break
          }
          case document.querySelector(".Button2"):{
            buttonGroup = ".ProjectsGroup";
            gsap.to(root.position, {y: 0, duration: 1, overwrite: "auto"});
            gsap.to(camera.position, {x: 0.15, y: 0.3, z: -1, duration: 1, overwrite: "auto"});
            gsap.to(camera.rotation, {x: 0, duration: 1, overwrite: "auto"});
            gsap.to(camera.rotation, {y: Math.PI, duration: 1, overwrite: "auto"});
            gsap.to(laptopHinge.rotation, {x: Math.PI * 150 / 180, duration: 1, overwrite: "auto"});
            spawnIcons();
            break;
          }
          case document.querySelector(".Button3"):{
            buttonGroup = ".AboutGroup";
            gsap.to(root.position, {y: -0.5, duration: 1, overwrite: "auto"});
            gsap.to(laptopHinge.rotation, {x: 0, duration: 1, overwrite: "auto"});
            removeIcons();
            break;
          }
        }
        [".HomeGroup", ".ProjectsGroup", ".AboutGroup"].forEach((element) => {
          gsap.to(element, {opacity: element === buttonGroup ? 1 : 0, duration: 0.5, overwrite: "auto"});
        });
        break;
      }
      case DOMHover === document.querySelector(".Filter1Div") && filterButtonsActive: {
        gsap.set(".Filter1Div", {backgroundColor: "rgba(255, 255, 255, 0.15)", overwrite: "auto"});
        gsap.to(".Filter1Div", {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.5, overwrite: "auto"});
        if (activeFilters.PROGRAMMING) {
          activeFilters.PROGRAMMING = false;
          document.querySelectorAll(".FilterIcon1Div").forEach((child) => {child.style.backgroundColor = "rgba(255, 255, 255, 0.05)"});
        }
        else {
          activeFilters.PROGRAMMING = true;
          document.querySelectorAll(".FilterIcon1Div").forEach((child) => {child.style.backgroundColor = "lightgreen"});
        }
        spawnIcons();
        break;
      }
      case DOMHover === document.querySelector(".Filter2Div") && filterButtonsActive: {
        gsap.set(".Filter2Div", {backgroundColor: "rgba(255, 255, 255, 0.15)", overwrite: "auto"});
        gsap.to(".Filter2Div", {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.5, overwrite: "auto"});
        if (activeFilters.TECHNICAL_ART) {
          activeFilters.TECHNICAL_ART = false;
          document.querySelectorAll(".FilterIcon2Div").forEach((child) => {child.style.backgroundColor = "rgba(255, 255, 255, 0.05)"});
        }
        else {
          activeFilters.TECHNICAL_ART = true;
          document.querySelectorAll(".FilterIcon2Div").forEach((child) => {child.style.backgroundColor = "#ffff8d"});
        }
        spawnIcons();
        break;
      }
      case DOMHover === document.querySelector(".Filter3Div") && filterButtonsActive: {
        gsap.set(".Filter3Div", {backgroundColor: "rgba(255, 255, 255, 0.15)", overwrite: "auto"});
        gsap.to(".Filter3Div", {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.5, overwrite: "auto"});
        if (activeFilters.ART) {
          activeFilters.ART = false;
          document.querySelectorAll(".FilterIcon3Div").forEach((child) => {child.style.backgroundColor = "rgba(255, 255, 255, 0.05)"});
        }
        else {
          activeFilters.ART = true;
          document.querySelectorAll(".FilterIcon3Div").forEach((child) => {child.style.backgroundColor = "lightcoral"});
        }
        spawnIcons();
        break;
      }
    }

    if (raycastResult) {
      switch (true) {
        case raycastResult.parent.name === "IconGroup":
          const iconGroup = raycastResult.parent;
          if (iconGroup.userData.tl && iconGroup.userData.tl.isActive()) {
            iconGroup.userData.tl.kill();
          }
          const tl = gsap.timeline();
          iconGroup.userData.tl = tl;
          tl.to(iconGroup.scale, {x: ICON_SCALE / 1.5, y: ICON_SCALE / 1.5, z: 1, duration: 0.5, overwrite: "auto"})
            .to(iconGroup.position, {z: -0.15, duration: 0.5, overwrite: true}, "<")
            .to(iconGroup.userData.iconHover.material, {opacity: 0, duration: 1, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconOverlay.material, {opacity: 1, duration: 1, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.repeat, {x: iconGroup.userData.screenTextureRepeatX, y: 1, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.offset, {x: iconGroup.userData.screenTextureOffsetX, y: 0, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material, {opacity: 0.5, duration: 1, overwrite: "auto"}, "<").call(() => {
            animationLock = null;
          }, null, ">");
          document.body.style.cursor = "default";
          userLock = true;
          gsap.to(iconGroup.position, {x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto"});
          gsap.to(iconGroup.scale, {x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto"});
          diveIn();

          if (monitorPowered) {
            const homeSection = document.querySelector(".HomeSection");
            const aboutSection = document.querySelector(".AboutSection");
            const slotSection = document.querySelector(".SlotSection");
            gsap.to(homeSection, {opacity: 0, duration: 1});
            gsap.to(aboutSection, {opacity: 0, duration: 1});
            gsap.to(slotSection, {opacity: 1, duration: 1});
          }
          else {
            const color2 = new THREE.Color(0xff0000);
            gsap.to(monitorButton.material.color, {r: color2.r, g: color2.g, b: color2.b, duration: 0.2, overwrite: "auto"});
          }
          dragging = iconGroup;
          break;
        case raycastResult.name === "MonitorButton":
          monitorToggle();
          break;
      }
      if (dragging) {
        plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).clone(), dragging.position);
        raycaster.ray.intersectPlane(plane, intersection);
        offset.copy(intersection).sub(dragging.position);
      }
    }
  }
})

window.addEventListener("mouseup", () => {
  mouseDown = false;
  if (dragging && !userLock) {
    switch (true) {
      case dragging.name === "IconGroup":
        break;
    }
    dragging = null;
  }});

window.addEventListener("resize", () => {
  if (userLock && !mobileUser)
    location.reload();
  else {
    resize();
    //scrollCameraTo(0, 0);
  }
});

function resize() {
  screenSize.width = window.innerWidth;
  screenSize.height = window.innerHeight;

  const targetAspect = 16 / 9;
  let newWidth, newHeight;
  if (screenSize.width / screenSize.height > targetAspect) {
    newHeight = screenSize.height;
    newWidth = screenSize.height * targetAspect;
  } else {
    newWidth = screenSize.width;
    newHeight = screenSize.width / targetAspect;
  }
  cameraWrapper.centeredDiv.style.width = `${newWidth}px`;
  cameraWrapper.centeredDiv.style.height = `${newHeight}px`;
  cameraWrapper.centeredDiv.style.fontSize = `${newWidth / DEFAULT_FONT_SIZE}px`;

  divPositionMultiplier = newWidth * MAGIC_DIV_OFFSET;

  const divRect = cameraWrapper.centeredDiv.getBoundingClientRect();

  canvas.style.width = `${divRect.width}px`;
  canvas.style.height = `${divRect.height}px`;

  renderer.setSize(screenSize.width, screenSize.height, true);
  //camera.position.z = -0.9 * (screenSize.height / newHeight);
  camera.aspect = screenSize.width / screenSize.height;
  camera.updateProjectionMatrix();
}

function getMouseWorldPosition() {
  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(lookPlane, lookIntersection);
  return lookIntersection.clone();
}

/*function scrollTrigger() {

  const cameraPositionNormalized = Math.min(1, Math.max(0, -camera.position.y / MAX_SCROLL));

  //PORTFOLIO BUTTON TEXT
  const portfolioButtonTextDiv = document.querySelector(".PortfolioButtonTextDiv");
  const portfolioButtonTextStart = 0.4;
  const portfolioButtonTextEnd = 0.7;
  let portfolioButtonTextState = (portfolioButtonTextEnd - cameraPositionNormalized) / (portfolioButtonTextEnd - portfolioButtonTextStart);
  switch (true) {
    case cameraPositionNormalized < portfolioButtonTextStart: portfolioButtonTextState = 1; break;
    case cameraPositionNormalized > portfolioButtonTextEnd: portfolioButtonTextState = 0; break;
  }
  portfolioButtonTextDiv.style.opacity = portfolioButtonTextState;
  portfolioButtonTextDiv.style.filter = `blur(${(1 - portfolioButtonTextState) * 5}vh)`;
  portfolioButtonActive = portfolioButtonTextState > 0.9;

  //PORTFOLIO BUTTON
  const portfolioButtonDiv = document.querySelector(".PortfolioButtonDiv");
  const portfolioButtonDivStart = 0.4;
  const portfolioButtonDivEnd = 0.6;
  let portfolioButtonDivState = (cameraPositionNormalized - portfolioButtonDivStart) / (portfolioButtonDivEnd - portfolioButtonDivStart);
  switch (true) {
    case cameraPositionNormalized < portfolioButtonDivStart: portfolioButtonDivState = 0; break;
    case cameraPositionNormalized > portfolioButtonDivEnd: portfolioButtonDivState = 1; break;
  }
  portfolioButtonDiv.style.width = `${(portfolioButtonDivState * 18.5) + 30}%`;

  //ICON BUTTON
  const homeButtonDiv = document.querySelector(".HomeButtonDiv");
  const aboutButtonDiv = document.querySelector(".AboutButtonDiv");
  const homeButtonIconStart = 0.3;
  const homeButtonIconEnd = 0.5;
  let homeButtonIconState = (homeButtonIconEnd - cameraPositionNormalized) / (homeButtonIconEnd - homeButtonIconStart);
  switch (true) {
    case cameraPositionNormalized < homeButtonIconStart: homeButtonIconState = 1; break;
    case cameraPositionNormalized > homeButtonIconEnd: homeButtonIconState = 0; break;
  }
  homeButtonDiv.style.opacity = homeButtonIconState;
  portfolioButtonActive = portfolioButtonDivState < 0.1;
  aboutButtonDiv.style.opacity = homeButtonIconState;

  //FILTER BUTTONS
  const filterTextDivDiv = document.querySelector(".FilterDivDiv");
  const filterTextDivDivStart = 0.5;
  const filterTextDivDivEnd = 0.8;
  let filterTextDivDivState = (cameraPositionNormalized - filterTextDivDivStart) / (filterTextDivDivEnd - filterTextDivDivStart);
  switch (true) {
    case cameraPositionNormalized < filterTextDivDivStart: filterTextDivDivState = 0; break;
    case cameraPositionNormalized > filterTextDivDivEnd: filterTextDivDivState = 1; break;
  }
  filterTextDivDiv.style.opacity = filterTextDivDivState;
  filterTextDivDiv.style.filter = `blur(${(1 - filterTextDivDivState) * 5}vh)`;
  filterButtonsActive = filterTextDivDivState === 1;

  //GLASS OPACITY
  const iconScreenStart = 0.3;
  const iconScreenEnd = 0.8;
  let iconScreenState = (iconScreenEnd - cameraPositionNormalized) / (iconScreenEnd - iconScreenStart);
  switch (true) {
    case cameraPositionNormalized < iconScreenStart: iconScreenState = 1; break;
    case cameraPositionNormalized > iconScreenEnd: iconScreenState = 0; break;
  }
  glassMaterial.opacity = iconScreenState / 2 + 0.3;

  if (filterButtonsActive && filterButtonHover && !dragging && !userLock) {
    document.body.style.cursor = "pointer";
    gsap.to(filterButtonHover, {backgroundColor: "rgba(255, 255, 255, 0.1)", ease: "back", duration: 0.2, overwrite: "auto"});
  }
  if (portfolioButtonActive && portfolioButtonHover && !dragging && !userLock) {
    document.body.style.cursor = "pointer";
    gsap.to(portfolioButtonHover, {backgroundColor: "rgba(255, 255, 255, 0.1)", ease: "back", duration: 0.2, overwrite: "auto"});
  }
  if (!portfolioButtonActive && portfolioButtonHover && !dragging && !userLock) {
    gsap.to(portfolioButtonHover, {backgroundColor: "rgba(255, 255, 255, 0.05)", ease: "back", duration: 0.2, overwrite: "auto"});
  }
  if (!portfolioButtonActive && portfolioButtonHover && !filterButtonHover && !dragging && !userLock) {
    document.body.style.cursor = "default";
  }
  if (!filterButtonsActive && !portfolioButtonActive && filterButtonHover && !dragging && !userLock) {
    document.body.style.cursor = "default";
    gsap.to(filterButtonHover, {backgroundColor: "rgba(255, 255, 255, 0.05)", ease: "back", duration: 0.2, overwrite: "auto"});
  }
}*/

/*function scrollCameraBy(deltaY, duration) {
  cameraWrapper.centeredDiv.style.willChange = "transform";
  const afterScroll = cameraWrapper.camera.position.y - deltaY;
  if (afterScroll >= 0) {
    gsap.to(cameraWrapper.camera.position, {y: 0, duration: duration, overwrite: true, onUpdate: scrollTrigger});
    gsap.to(cameraWrapper.centeredDiv, {y: 0, duration: duration, overwrite: true, onComplete: () => {cameraWrapper.centeredDiv.style.willChange = "auto"}});
  }
  else if (afterScroll <= -MAX_SCROLL) {
    gsap.to(cameraWrapper.camera.position, {y: -MAX_SCROLL, duration: duration, overwrite: true, onUpdate: scrollTrigger});
    gsap.to(cameraWrapper.centeredDiv, {y: -MAX_SCROLL * divPositionMultiplier * gsap.getProperty(cameraWrapper.centeredDiv, "scale"), duration: duration, overwrite: true, onComplete: () => {cameraWrapper.centeredDiv.style.willChange = "auto"}});
  }
  else {
    gsap.to(cameraWrapper.camera.position, {y: `-=${deltaY}`, duration: duration, overwrite: true, onUpdate: scrollTrigger});
    gsap.to(cameraWrapper.centeredDiv, {y: `-=${deltaY * divPositionMultiplier * gsap.getProperty(cameraWrapper.centeredDiv, "scale")}`, duration: duration, overwrite: true, onComplete: () => {cameraWrapper.centeredDiv.style.willChange = "auto"}});
  }
}*/

/*function scrollCameraTo(Y, duration) {
  cameraWrapper.centeredDiv.style.willChange = "transform";
  gsap.to(cameraWrapper.camera.position, {y: Y, duration: duration, overwrite: "auto", onUpdate: scrollTrigger});
  gsap.to(cameraWrapper.centeredDiv, {y: Y * divPositionMultiplier, duration: duration, overwrite: "auto", onComplete: () => {cameraWrapper.centeredDiv.style.willChange = "auto"}});
}*/

/*function scrollMonitorBy(deltaY, duration, boolean) {
  if (boolean && deltaY > 0) {
    scrollingDiscovered = true;
    clearInterval(scrollShowInterval);
    scrollShowInterval = null;
  }
  cameraWrapper.scrollDiv.style.willChange = "transform";
  const afterScroll = cameraWrapper.scrollDiv.offsetTop / cameraWrapper.scrollDiv.parentElement.clientHeight * -100 + deltaY;
  if (afterScroll <= 0) {
    gsap.to(cameraWrapper.scrollDiv, {top: "0%", duration: duration, overwrite: "auto", onComplete: () => {cameraWrapper.scrollDiv.style.willChange = "auto"}});
    gsap.to(cameraWrapper.faceForegroundImage, {top: "71%", width: "30%", duration: duration, overwrite: "auto"});
  }
  else if (afterScroll >= 100) {
    gsap.to(cameraWrapper.scrollDiv, {top: "-100%", duration: duration, overwrite: "auto", onComplete: () => {cameraWrapper.scrollDiv.style.willChange = "auto"}});
    gsap.to(cameraWrapper.faceForegroundImage, {top: "46%", width: "35%", duration: duration, overwrite: "auto"});
  }
  else {
    gsap.to(cameraWrapper.scrollDiv, {top: `-=${deltaY}%`, duration: duration, overwrite: "auto", onComplete: () => {cameraWrapper.scrollDiv.style.willChange = "auto"}});
    gsap.to(cameraWrapper.faceForegroundImage, {top: `-=${deltaY / 4}%`, width: `+=${deltaY / 20}%`, duration: duration, overwrite: "auto"});
  }
}*/

let s = 1;
let lastScale = 1;
function zoomCameraTo(scrollZ, duration, boolean) {
  const baseZoom = camera.position.z;
  gsap.to(camera.position, {z: scrollZ, duration: duration, ease: "power1.inOut", onUpdate: () => {
      if (boolean)
        s = lastScale * (baseZoom / camera.position.z) + (gsap.getProperty(cameraWrapper.centeredDiv, "scale") - 1) / 20;
      else
        s = lastScale * (baseZoom / camera.position.z);
      gsap.set(cameraWrapper.centeredDiv, {scale: s});
      }, onComplete: () => {lastScale = gsap.getProperty(cameraWrapper.centeredDiv, "scale")}
  });
}

function diveIn() {
  zoomCameraTo(-0.35, 2, true)
  setTimeout(() => location.assign("pjc.html"), 2000);
}

function randomizePosition(object, minX, maxX, minY, maxY, minZ, maxZ) {
  object.position.x = randomValueBounds(minX, maxX);
  object.position.y = randomValueBounds(minY, maxY);
  object.position.z = randomValueBounds(minZ, maxZ);
}

function ambientAnimation(obj) {
  const positionDeviation = 0.2;
  const rotationDeviation = Math.PI;
  const target = {
    x: obj.position.x + randomValueBounds(-positionDeviation, positionDeviation),
    y: obj.position.y + randomValueBounds(-positionDeviation, positionDeviation),
    rx: obj.rotation.x + randomValueBounds(-rotationDeviation, rotationDeviation),
    ry: obj.rotation.y + randomValueBounds(-rotationDeviation, rotationDeviation),
    rz: obj.rotation.z + randomValueBounds(-rotationDeviation, rotationDeviation),
    s: randomValueBounds(0.8, 2)
  };

  gsap.to(obj.position, {x: target.x, y: target.y, repeat: -1, yoyo: true, duration: randomValueBounds(30, 60)});
  gsap.to(obj.rotation, {x: target.rx, y: target.ry, z: target.rz, repeat: -1, yoyo: true, duration: randomValueBounds(30, 60)});
  gsap.to(obj.scale, {x: target.s, y: target.s, z: target.s, repeat: -1, yoyo: true, duration: randomValueBounds(30, 60)});
}

function randomValueBounds(min, max) {
  return Math.random() * (max - min) + min;
}

function monitorToggle() {
  if (monitorPowered) {
    monitorCover.material.visible = true;
    gsap.killTweensOf(monitorButton.material.color);
    const color = new THREE.Color(0x000000);
    gsap.set(monitorButton.material.color, {r: color.r, g: color.g, b: color.b, overwrite: "auto"});
    monitorPowered = false;
  }
  else {
    monitorCover.material.visible = false;
    const color = new THREE.Color(0xff0000);
    gsap.set(monitorButton.material.color, {r: color.r, g: color.g, b: color.b, overwrite: "auto"});
    monitorPowered = true;
  }
}

function monitorState(boolean) {
  if (boolean) {
    monitorActive = true;
    if (!scrollingDiscovered && !scrollShowInterval)
      scrollShowInterval = setInterval(() => {
        scrollMonitorBy(5, 2);
        setTimeout(() => scrollMonitorBy(-5, 0.5), 2000);
      }, 10000);
  }
  else {
    monitorActive = false;
    clearInterval(scrollShowInterval);
    scrollShowInterval = null;
  }
}

async function loadIcons(iconParameters) {
  for (const parameters of iconParameters) {
    iconArray.push(new Icon(...parameters));
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

function spawnIcons(boolean) {
  let oldSpawnedIconsNumber = iconGroupGroup.children.length;
  let newSpawnedIconsNumber = 0;
  if (!oldSpawnedIconsNumber) {
    spawnIconsHelper(boolean);
  }
  else {
    filterButtonsActive = false;
    iconGroupGroup.children.forEach((child) => {
      gsap.killTweensOf(child.position);
      gsap.killTweensOf(child.scale);
      gsap.to(child.scale, {x: 0, y: 0, z: 0, duration: 0.2, overwrite: "auto", onComplete: () => {
          iconGroupGroup.remove(child);
          if (++newSpawnedIconsNumber === oldSpawnedIconsNumber){}
            spawnIconsHelper();
        }
      });
    });
  }
  iconGroupGroup.rotation.x = ICON_ROTATION;
  scene.add(iconGroupGroup);
}

function spawnIconsHelper(boolean) {
  const iconGroupSpawnerCurrentPosition = ICON_GROUP_SPAWNER_INITIAL_POSITION.clone();
  iconArray.forEach((iconGroup) => {
    Object.keys(projectType).forEach((type) => {
      if (iconGroup.type === projectType[type] && (activeFilters[type] || Object.values(activeFilters).every(v => !v))) {
        gsap.killTweensOf(iconGroup.object.position);
        gsap.killTweensOf(iconGroup.object.scale);
        if (!boolean)
          filterButtonsActive = true;
        if (DOMHover) {
          document.body.style.cursor = "pointer";
          gsap.to(DOMHover, {backgroundColor: "rgba(255, 255, 255, 0.1)", ease: "back", duration: 0.2});
        }
        if (iconGroupSpawnerCurrentPosition.x <= ICON_GROUP_SPAWNER_INITIAL_POSITION.x - (ICON_GAP_HORIZONTAL * 3)) {
          iconGroupSpawnerCurrentPosition.y -= ICON_GAP_VERTICAL - 0.001;
          iconGroupSpawnerCurrentPosition.x = ICON_GROUP_SPAWNER_INITIAL_POSITION.x;
        }
        iconGroup.object.position.copy(iconGroupSpawnerCurrentPosition);
        iconGroup.originalPosition = iconGroup.object.position.clone();
        iconGroupSpawnerCurrentPosition.x -= ICON_GAP_HORIZONTAL;
        iconGroupGroup.add(iconGroup.object);
        iconGroup.object.rotation.z = Math.PI / 4;
        gsap.to(iconGroup.object.rotation, {x: ICON_ROTATION, y: 0, z: 0, duration: 0.3, ease: "back", overwrite: "auto"})
        gsap.to(iconGroup.object.scale, {x: ICON_SCALE, y: ICON_SCALE, z: 1, duration: 0.5, ease: "back(0.5)", overwrite: "auto"});
      }
    });
  });
  if (!iconGroupGroup.children.length) {
    if (!boolean)
      filterButtonsActive = true;
    if (DOMHover)
      document.body.style.cursor = "pointer";
  }
}

function removeIcons() {
  iconGroupGroup.children.forEach((child) => {
    gsap.killTweensOf(child.position);
    gsap.killTweensOf(child.scale);
    gsap.to(child.scale, {x: 0, y: 0, z: 0, duration: 0.2, overwrite: "auto", onComplete: () => {
        iconGroupGroup.remove(child);
      }
    });
  });
}

function onLoad() {
  gsap.set(cameraWrapper.centeredDiv, {xPercent: -50, yPercent: -50, y: 0});
  gsap.to(".LoadingDiv", {opacity: 0, duration: 4});
  document.querySelector(".BackgroundVideo").src = "https://PortfolioPullZone.b-cdn.net/LandingPage/BackgroundStrip.webm";
  videoPlayer1.src = playlist[0];
  videoPlayer2.src = playlist[0];
  videoPlayer1.play();
  videoPlayer2.play();
  iconArray.forEach((child) => {child.video.play()});
  /*if (screenSize.width / screenSize.height > 16 / 9) {
    zoomCameraTo(-1.2, 0);
    zoomCameraTo(-0.9, 2);
  }
  else {
    zoomCameraTo(-0.9 * (screenSize.height / screenSize.width * 16 / 9) * 1.2, 0);
    zoomCameraTo(-0.9 * (screenSize.height / screenSize.width * 16 / 9), 2);
  }*/
  finishedLoading = true;
  setTimeout(() => {
    userLock = false;
    gsap.set(".LoadingDiv", {pointerEvents: "none", overwrite: "auto"})}, 2000);
}

function printDebug(log) {
  const div = document.querySelector(".Debug2");
  gsap.set(div, {innerHTML: `${div.innerHTML}<br>${log}`});
}

class Icon {
  constructor(type, videoPath, title, description, tags = [], bakedOverlayTexture) {
    this.type = type;
    this.originalPosition = new THREE.Vector3();
    this.object = iconComponentGroup.clone();
    this.object.scale.set(ICON_SCALE, ICON_SCALE, 1);
    this.object.rotation.x = ICON_ROTATION;
    this.object.userData = this;
    this.iconHitbox = this.object.children.find((child) => child.name === "IconHitbox");
    this.iconGlow = this.object.children.find((child) => child.name === "IconGlow");
    this.iconScreen = this.object.children.find((child) => child.name === "IconScreen");
    this.iconOverlay = this.object.children.find((child) => child.name === "IconOverlay");
    this.iconHover = this.object.children.find((child) => child.name === "IconHover");

    //ICON HITBOX
    raycastTargetArray.push(this.iconHitbox);

    //ICON SCREEN
    this.video = document.createElement("video");
    this.video.crossOrigin = "anonymous";
    this.video.src = videoPath;
    this.video.preload = "auto";
    this.video.loop = true;
    this.video.muted = true;
    this.video.addEventListener("loadedmetadata", () => {
      this.videoTexture = new THREE.VideoTexture(this.video);
      this.videoTexture.flipY = false;
      this.videoTexture.colorSpace = THREE.SRGBColorSpace;
      this.videoTexture.minFilter = THREE.LinearFilter;
      this.videoTexture.magFilter = THREE.LinearFilter;
      this.videoTexture.wrapS = THREE.RepeatWrapping;
      this.videoTexture.wrapT = THREE.RepeatWrapping;
      this.videoTexture.generateMipmaps = false;
      this.iconScreen.material = new THREE.MeshBasicMaterial({map: this.videoTexture, opacity: 0.5, transparent: true, side: THREE.DoubleSide});
      this.aspectRatio = this.video.videoWidth / this.video.videoHeight;
      this.screenTextureRepeatX = 1 / this.aspectRatio;
      this.screenTextureOffsetX = (1 - 1 / this.aspectRatio) / 2;
      this.iconScreen.material.map.repeat.set(this.screenTextureRepeatX, 1);
      this.iconScreen.material.map.offset.set(this.screenTextureOffsetX, 0);
    });


    //ICON GLOW
    const h2cGlowDiv = document.querySelector(".h2cGlowDiv");
    html2canvas(h2cGlowDiv, {scale: 1, backgroundColor: null, useCORS: true, ignoreElements: (element) => element.tagName === "VIDEO", width: h2cGlowDiv.offsetWidth, height: h2cGlowDiv.offsetHeight}).then((glowCanvas) => {

      const glowCompCanvas = document.createElement("canvas");
      glowCompCanvas.width = 1000;
      glowCompCanvas.height = 1000;

      glowCompCanvas.getContext("2d").translate(225, 225);
      glowCompCanvas.getContext("2d").filter = "blur(40px)";
      glowCompCanvas.getContext("2d").drawImage(glowCanvas, 0, 0);

      const texture = new THREE.CanvasTexture(glowCompCanvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 1;
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      this.iconGlow.material = new THREE.MeshBasicMaterial({map: texture, transparent: true, depthWrite: false});

    });

    if (BAKE_ICON_OVERLAY) {
      //ICON OVERLAY
      const h2cFilterDiv = document.querySelector(".h2cFilterDiv");
      switch (type) {
        case projectType.PROGRAMMING: h2cFilterDiv.style.backgroundColor = "lightgreen"; break;
        case projectType.TECHNICAL_ART: h2cFilterDiv.style.backgroundColor = "#ffff69"; break;
        case projectType.ART: h2cFilterDiv.style.backgroundColor = "lightcoral"; break;
      }
      const h2cTitleDiv = document.querySelector(".h2cTitle");
      h2cTitleDiv.textContent = title;
      const h2cDescriptionDiv = document.querySelector(".h2cDescription");
      h2cDescriptionDiv.textContent = description;
      Object.values(h2cTags).forEach((tag) => {tag.style.opacity = 0});
      let currentTagPosition = [50, 50];
      function placeTag(tag) {
        tag.style.opacity = 1;
        if (currentTagPosition[0] + tag.getBoundingClientRect().width + 15 > 900) {
          currentTagPosition[0] = 50;
          currentTagPosition[1] += tag.getBoundingClientRect().height + 15
        }
        tag.style.left = currentTagPosition[0] + "px";
        tag.style.top = currentTagPosition[1] + "px";
        currentTagPosition[0] += tag.getBoundingClientRect().width + 15
      }
      tags.forEach((tag) => {
        if (tag in h2cTags)
          placeTag(h2cTags[tag]);
      });

      const h2cBackgroundDiv = document.querySelector(".h2cBackgroundDiv");
      const h2cTextDiv = document.querySelector(".h2cTextDiv");
      const h2cForegroundDiv = document.querySelector(".h2cForegroundDiv");
      const h2cBorderDiv = document.querySelector(".h2cBorderDiv");
      Promise.all([
        html2canvas(h2cBackgroundDiv, {scale: 1, backgroundColor: null, useCORS: true, ignoreElements: (element) => element.tagName === "VIDEO", width: h2cBackgroundDiv.offsetWidth, height: h2cBackgroundDiv.offsetHeight}),
        html2canvas(h2cTextDiv, {scale: 1, backgroundColor: null, useCORS: true, ignoreElements: (element) => element.tagName === "VIDEO", width: h2cTextDiv.offsetWidth, height: h2cTextDiv.offsetHeight}),
        html2canvas(h2cForegroundDiv, {scale: 1, backgroundColor: null, useCORS: true, ignoreElements: (element) => element.tagName === "VIDEO", width: h2cForegroundDiv.offsetWidth, height: h2cForegroundDiv.offsetHeight}),
        html2canvas(h2cBorderDiv, {scale: 1, backgroundColor: null, useCORS: true, ignoreElements: (element) => element.tagName === "VIDEO", width: h2cBorderDiv.offsetWidth, height: h2cBorderDiv.offsetHeight})
      ]).then(([backgroundCanvas, textCanvas, foregroundCanvas, borderCanvas]) => {

        let textCompCanvas = document.createElement("canvas");
        textCompCanvas.width = 1000;
        textCompCanvas.height = 1000;

        textCompCanvas.getContext("2d").filter = "blur(3px)";
        textCompCanvas.getContext("2d").drawImage(textCanvas, 0, 0);
        textCompCanvas.getContext("2d").filter = "none";
        textCompCanvas.getContext("2d").drawImage(textCanvas, 0, 0);

        let backgroundCompCanvas = document.createElement("canvas");
        backgroundCompCanvas.width = 1000;
        backgroundCompCanvas.height = 1000;

        backgroundCompCanvas.getContext("2d").drawImage(backgroundCanvas, 0, 0);
        backgroundCompCanvas.getContext("2d").drawImage(textCompCanvas, 0, 0);

        let foregroundCompCanvas = document.createElement("canvas");
        foregroundCompCanvas.width = 1000;
        foregroundCompCanvas.height = 1000;

        foregroundCompCanvas.getContext("2d").filter = "blur(10px)";
        foregroundCompCanvas.getContext("2d").drawImage(foregroundCanvas, 0, 0);
        foregroundCompCanvas.getContext("2d").filter = "blur(1px)";
        foregroundCompCanvas.getContext("2d").drawImage(foregroundCanvas, 0, 0);

        let borderCompCanvas = document.createElement("canvas");
        borderCompCanvas.width = 1000;
        borderCompCanvas.height = 1000;

        borderCompCanvas.getContext("2d").filter = "blur(10px)";
        borderCompCanvas.getContext("2d").drawImage(borderCanvas, 0, 0);
        borderCompCanvas.getContext("2d").filter = "none";
        borderCompCanvas.getContext("2d").drawImage(borderCanvas, 0, 0);

        let finalCompCanvas = document.createElement("canvas");
        finalCompCanvas.width = 1000;
        finalCompCanvas.height = 1000;

        finalCompCanvas.getContext("2d").drawImage(foregroundCompCanvas, 0, 0);
        finalCompCanvas.getContext("2d").drawImage(backgroundCompCanvas, 0, 0);
        finalCompCanvas.getContext("2d").drawImage(borderCompCanvas, 0, 0);

        const link = document.createElement("a");
        link.href = finalCompCanvas.toDataURL("image/png");
        link.download = title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        backgroundCanvas = null;
        textCanvas = null;
        foregroundCanvas = null;
        borderCanvas = null;

        textCompCanvas = null;
        backgroundCompCanvas = null;
        foregroundCompCanvas = null;
        borderCompCanvas = null;

        const texture = new THREE.CanvasTexture(finalCompCanvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 1;
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        this.iconOverlay.material = new THREE.MeshBasicMaterial({map: texture, transparent: true});
      });
    }
    else {
      this.iconOverlay.material = new THREE.MeshBasicMaterial({map: bakedOverlayTexture, transparent: true});
    }

    //ICON HOVER
    const h2cHoverDiv = document.querySelector(".h2cHoverDiv");
    html2canvas(h2cHoverDiv, {scale: 1, backgroundColor: null, useCORS: true, ignoreElements: (element) => element.tagName === "VIDEO", width: h2cHoverDiv.offsetWidth, height: h2cHoverDiv.offsetHeight}).then((hoverCanvas) => {
      const texture = new THREE.CanvasTexture(hoverCanvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 1;
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      this.iconHover.material = new THREE.MeshBasicMaterial({map: texture, transparent: true, opacity: 0});
    });
  }
}

//VIDEO PLAYER
// region
const videoPlayer1 = document.querySelector(".VideoPlayer1");
const videoPlayer2 = document.querySelector(".VideoPlayer2");
const playlist = ["https://PortfolioPullZone.b-cdn.net/LandingPage/Reel/KineticRush2.webm", "https://PortfolioPullZone.b-cdn.net/LandingPage/Reel/ChasmsCall2.webm"];
let currentIndex = 0;
videoPlayer1.addEventListener("ended", () => {
  if (++currentIndex < playlist.length) {
    videoPlayer1.src = playlist[currentIndex];
    videoPlayer2.src = playlist[currentIndex];
    videoPlayer1.play();
    videoPlayer2.play();
  } else {
    currentIndex = 0;
    videoPlayer1.src = playlist[currentIndex];
    videoPlayer2.src = playlist[currentIndex];
    videoPlayer1.play();
    videoPlayer2.play();
  }
});
//endregion

//HOME SECTION HOVER
//region
document.querySelector(".MonitorDiv").addEventListener("mouseenter", () => {
  monitorDivHover = true;
  gsap.to(videoPlayer2, {opacity: 0.7, duration: 0.2, overwrite: "auto"});
});
document.querySelector(".MonitorDiv").addEventListener("mouseleave", () => {
  monitorDivHover = false;
  gsap.to(videoPlayer2, {opacity: 0.5, duration: 1, overwrite: "auto"});
});
//endregion

//SKILL HOVER
//region
document.querySelectorAll(".SkillIconDivDiv").forEach((child) => {
  child.addEventListener("mouseenter", () => {
    gsap.to(child.querySelectorAll(".SkillTitleText"), {opacity: 1, duration: 0.2, overwrite: "auto"});
    gsap.to(child.querySelectorAll(".SkillTitleIconDiv"), {opacity: 0, duration: 0.2, overwrite: "auto"});
  });
  child.addEventListener("mouseleave", () => {
    gsap.to(child.querySelectorAll(".SkillTitleText"), {opacity: 0, duration: 0.2, overwrite: "auto"});
    gsap.to(child.querySelectorAll(".SkillTitleIconDiv"), {opacity: 1, duration: 0.2, overwrite: "auto"});
  });
});

document.querySelectorAll(".SkillIconDiv").forEach((child) => {
  child.addEventListener("mouseenter", () => {
    child.querySelectorAll(".SkillIconImage").length && gsap.to(child.querySelectorAll(".SkillIconImage"), {opacity: 0, duration: 0.2, overwrite: "auto"});
    child.querySelectorAll(".SkillTextIcon").length && gsap.to(child.querySelectorAll(".SkillTextIcon"), {opacity: 0, duration: 0.2, overwrite: "auto"});
    child.querySelectorAll(".SkillText").length && gsap.to(child.querySelectorAll(".SkillText"), {opacity: 1, duration: 0.2, overwrite: "auto"});
  });
  child.addEventListener("mouseleave", () => {
    child.querySelectorAll(".SkillIconImage").length && gsap.to(child.querySelectorAll(".SkillIconImage"), {opacity: 1, duration: 0.2, overwrite: "auto"});
    child.querySelectorAll(".SkillTextIcon").length && gsap.to(child.querySelectorAll(".SkillTextIcon"), {opacity: 1, duration: 0.2, overwrite: "auto"});
    child.querySelectorAll(".SkillText").length && gsap.to(child.querySelectorAll(".SkillText"), {opacity: 0, duration: 0.2, overwrite: "auto"});
  });
});
//endregion

//LOGO
//region
document.querySelectorAll(".LogoDiv")[1].addEventListener("mouseenter", () => {
  document.body.style.cursor = "pointer";
});
document.querySelectorAll(".LogoDiv")[1].addEventListener("mouseleave", () => {
  document.body.style.cursor = "default";
});
document.querySelectorAll(".LogoDiv")[1].addEventListener("click", () => {
  window.open("https://pja.edu.pl/en/", "_blank");
});
//endregion

//BUTTONS HOVER/LEAVE
//region
[document.querySelector(".Filter1Div"), document.querySelector(".Filter2Div"), document.querySelector(".Filter3Div")].forEach((button) => {
  button.addEventListener("mouseenter", () => {
    console.log("ASD");
    DOMHover = button;
    if (filterButtonsActive && !dragging && !userLock) {
      document.body.style.cursor = "pointer";
      gsap.to(button, {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.2, overwrite: "auto"});
    }});
  button.addEventListener("mouseleave", () => {
    DOMHover = null;
    gsap.to(button, {backgroundColor: "rgba(255, 255, 255, 0.05)", duration: 0.2, overwrite: "auto"});
    if (!portfolioButtonActive && !dragging && !userLock) {
      document.body.style.cursor = "default";
    }
  });
});
//endregion

resize();
//scrollTrigger();

/*
gsap.to(camera.position, {x: 0, y: 0.14, z: -0.5, duration: 1, overwrite: "auto"});
gsap.to(camera.rotation, {x: 0, duration: 1, overwrite: "auto"});
gsap.to(camera.rotation, {y: Math.PI, duration: 1, overwrite: "auto"});
gsap.to(laptopHinge.rotation, {x: Math.PI / 2, duration: 1, overwrite: "auto"});*/
