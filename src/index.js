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
  [projectType.PROGRAMMING, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/KineticRush4.webm", "Kinetic Rush", "A running-themed community challenge", ["blender", "css", "photoshop"], "pjc"],
  [projectType.TECHNICAL_ART, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/ChasmsCall4.webm", "Project 2", "Description 2", ["blender", "js"], "pjc2"],
  [projectType.ART, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/ChasmsCall4.webm", "Project 3", "Description 3", ["aftereffects"], "pjc2"],
  [projectType.ART, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/ChasmsCall4.webm", "Project 4", "Description 4", ["css"], "pjc2"]
];

//CONSTANTS
//region
//VERY IMPORTANT
const BAKE_ICON_OVERLAY = false;
const EXPORT_TEXTURES = false;
printDebug(BAKE_ICON_OVERLAY ? "Baking textures..." : "Skipped baking textures!");

//const
//MOBILE_USER = "ontouchstart" in window || navigator.maxTouchPoints > 0;
const MOBILE_USER = false;
const MAIN_COLOR_NORMALIZED = new THREE.Color(0x9EDFFF);
const MAGIC_DIV_OFFSET = 0.96;
const MAX_SCROLL = 1;
const DEFAULT_FONT_SIZE = 15;
const ICON_GROUP_SPAWNER_INITIAL_POSITION = new THREE.Vector3(0, 0, 0);
const ICON_GAP_HORIZONTAL = 0.175;
const ICON_SCALE = 2;
const ROOT_START_POSITION = new THREE.Vector3(-0.05, -0.07, -0.25);
const ROOT_START_ROTATION = new THREE.Euler(Math.PI * 170 / 180, Math.PI * 210 / 180, Math.PI);
//endregion

//THREE JS SETUP
//region
const scene = new THREE.Scene();
const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight
};
const camera = new THREE.PerspectiveCamera( 35.98339890412515, screenSize.width / screenSize.height, 0.01, 1000);
const cameraWrapper = {
  camera: camera,
  centeredTopDiv: document.querySelector(".CenteredTopDiv"),
  centeredBottomDiv: document.querySelector(".CenteredBottomDiv")
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
  if (!MOBILE_USER) {
    renderer.compile(scene, camera);
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
const textureBake2 = textureLoader.load("Bake2.png", (textureBake) => {
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
const laptopVideo = document.createElement("video");
laptopVideo.crossOrigin = "anonymous";
laptopVideo.preload = "auto";
laptopVideo.muted = true;
laptopVideo.playsInline = true;
const laptopScreenTexture = new THREE.VideoTexture(laptopVideo);
laptopScreenTexture.flipY = false;
laptopScreenTexture.colorSpace = THREE.SRGBColorSpace;
laptopScreenTexture.minFilter = THREE.LinearFilter;
laptopScreenTexture.magFilter = THREE.LinearFilter;
laptopScreenTexture.wrapS = THREE.RepeatWrapping;
laptopScreenTexture.wrapT = THREE.RepeatWrapping;
laptopScreenTexture.repeat = new THREE.Vector2(1, 1);
laptopScreenTexture.generateMipmaps = false;
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
        child.material = new THREE.MeshBasicMaterial({map: textureBake2});
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
        child.material = new THREE.MeshBasicMaterial({map: textureBake, side: THREE.DoubleSide});
        laptopDisplay = child;
        break;
      case child.name === "LaptopLetterboxing":
        child.material = new THREE.MeshBasicMaterial({color: 0x080808});
        laptopScreen = child;
        break;
      case child.name === "LaptopScreen":
        child.material = new THREE.MeshBasicMaterial({map: laptopScreenTexture, opacity: 0.8, transparent: true});
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
/*Object.values(h2cTags).forEach((tag) => {
  tag.style.opacity = 0;
});*/

//SPAWN ASSETS
loader.load("LandingPage/Models/AssetsCompressed.glb", (glb) => {
  glb.scene.traverse((child) => {
    switch (true) {
      case child.name === "IconGroup":
        iconComponentGroup = child;
        break;
      case child.name.includes("IconFrame"):
        child.material = new THREE.MeshBasicMaterial({visible: false});
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
  if (!MOBILE_USER) {
    loadIcons(iconParameters).then(() => {spawnIcons(true); removeIcons();});
  }

  primitiveArray.forEach((primitive) => {
    if (Math.random() > 0.8)
      randomizePosition(primitive, -0.1, 0.1, -1, 0.5,0.1, 0.2);
    else
      randomizePosition(primitive, -0.1, 0.1, -1, 0.5,0.1, 0.2);
    ambientAnimation(primitive);
    //scene.add(primitive);
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
const lookPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -5);
const lookIntersection = new THREE.Vector3();
let raycastResult = null;
let previousRaycastResult = null;
let userLock = true;
let animationLock = null;

let divPositionMultiplier = null;

let DOMHover = null;
let portfolioButtonActive = true;

let filterButtonsActive = false;

const Sections = {
  START: "Start",
  HOME: "Home",
  TRANSITION1: "Transition1",
  PROJECTS: "Projects",
  ABOUT: "About"
};
let activeSection = null;

let activeIconIndex = 0;

const scrollYWrapper = {y: 0};

let relativeRootPosition = new THREE.Vector3();
let relativeRootRotation = new THREE.Euler();

const mouseScreenPosition = {
  x: null,
  y: null
};

let clickedDOM = null;

const DOMIconGlowWrapper = {
  activeIndex: 0,
  1: document.querySelector(".IconGlow1"),
  2: document.querySelector(".IconGlow2")
}

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

    if (clickedDOM === document.querySelector(".ScrollBarDiv") && mouseDown) {
      const rect = document.querySelector(".ScrollBarDiv").getBoundingClientRect();
      const button = document.querySelector(".ScrollButton").getBoundingClientRect();
      const offsetY = mouseScreenPosition.y - rect.top - button.height / 2;
      let percentY = offsetY / (rect.height - button.height);
      percentY = Math.min(Math.max(percentY, 0), 1);
      scrollCameraTo(percentY, 0);
    }

    if (raycast.length) {
      raycastResult = raycast[0].object;
      switch (true) {
        case raycastResult.parent.name === "IconGroup" && (raycastResult.parent === dragging || !dragging):
          const targetMatrix = new THREE.Matrix4().lookAt(raycastResult.parent.position, getMouseWorldPosition(), raycastResult.parent.up);
          targetMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
          targetMatrix.multiply(new THREE.Matrix4().makeRotationX(0));
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
            iconGroup.userData.video.pause();
            const tempTl = iconGroup.userData.tl;
            if (tempTl && tempTl.time() >= tempTl.labels["selected"])
              animationLock = previousRaycastResult;
            if (iconGroup.userData.tl && iconGroup.userData.tl.isActive()) {
              iconGroup.userData.tl.kill();
            }
            const tl = gsap.timeline();
            iconGroup.userData.tl = tl;
            tl.to(iconGroup.scale, {x: ICON_SCALE, y: ICON_SCALE, z: 1, duration: 0.25, overwrite: "auto"})
            .to(iconGroup.userData.iconHover.material, {opacity: 0, duration: 0.25, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.repeat, {x: iconGroup.userData.screenTextureRepeatX, y: 1, duration: 0.25, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.offset, {x: iconGroup.userData.screenTextureOffsetX, y: 0, duration: 0.25, overwrite: "auto"}, "<")
            .to(iconGroup.rotation, {x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material, {opacity: 1, duration: 0.5, overwrite: "auto"}, "<").call(() => {
              animationLock = null;
            }, null, ">")
            .to(iconGroup.position, {z: iconGroup.userData.originalPosition.z, duration: 0.25, overwrite: "auto"}, "<");
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
          case raycastResult.name === "IconHitbox" && raycastResult !== animationLock:
            document.body.style.cursor = "grab";
            const iconGroup = raycastResult.parent;
            iconGroup.userData.video.play();
            if (iconGroup.userData.tl && iconGroup.userData.tl.isActive())
              iconGroup.userData.tl.kill();
            const tl = gsap.timeline();
            iconGroup.userData.tl = tl;
            tl.to(iconGroup.userData.iconHover.material, {opacity: 1, duration: 0.25, overwrite: "auto"}).addLabel("selected").call(() => {
            })
            .to(iconGroup.position, {z: -0.15, duration: 0.5, overwrite: "auto"}, ">")
            .to(iconGroup.userData.iconScreen.material, {opacity: 1, duration: 1, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconHover.material, {opacity: 0, duration: 0.1, overwrite: "auto"}, "<")
            .to(iconGroup.scale, {x: ICON_SCALE * iconGroup.userData.aspectRatio, duration: 1, overwrite: "auto"}, ">")
            .to(iconGroup.userData.iconScreen.material.map.repeat, {x: 1, y: 1, duration: 1, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.offset, {x: 0, y: 0, duration: 1, overwrite: "auto"}, "<");
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
  `<br>clickedDOM ${clickedDOM ? clickedDOM.className : clickedDOM}` +
  `<br>raycastResult ${raycastResult ? `${raycastResult.name} ${raycastResult.id}` : raycastResult}` +
  `<br>previousRaycastResult ${previousRaycastResult ? `${previousRaycastResult.name} ${previousRaycastResult.id}` : previousRaycastResult}` +
  `<br>animationLock ${animationLock ? `${animationLock.name} ${animationLock.id}` : animationLock}` +
  `<br>userLock ${userLock}` +
  `<br>scrollYWrapper.y ${scrollYWrapper.y.toFixed(2)}` +
  `<br>activeIconIndex ${activeIconIndex}` +
  `<br>activeIcon ${iconGroupGroup.children.length ? `${iconGroupGroup.children[activeIconIndex].name} ${iconGroupGroup.children[activeIconIndex].id}` : "null"}` +
  `<br>activeSection ${activeSection}`});

  renderer.render(scene, camera);

}

//END OF THREE JS SETUP
//endregion

window.addEventListener("wheel", (event) => {
  scrollCameraBy(event.deltaY * 0.0003, 0.5);
});

window.addEventListener("mousemove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  mouseScreenPosition.x = event.clientX;
  mouseScreenPosition.y = event.clientY;
});

window.addEventListener("mousedown", (event) => {
  event.preventDefault();
  if (!userLock) {
    mouseDown = true;

    if (DOMHover)
      clickedDOM = DOMHover;
    switch (true) {
      case DOMHover && DOMHover.className.includes("MainButton"): {
        switch (DOMHover) {
          case document.querySelector(".Button1"):
            scrollCameraTo(0, 2);
            break;
          case document.querySelector(".Button2"):
            scrollCameraTo(0.4, 2);
            break;
          case document.querySelector(".Button3"):
            scrollCameraTo(0.7, 2);
            break;
          case document.querySelector(".Button4"):
            iconGroupGroup.children[activeIconIndex].userData.video.pause();
            gsap.to(iconGroupGroup.children[activeIconIndex].scale, {x: ICON_SCALE / 1.5, y: ICON_SCALE / 1.5, z: 1, duration: 0.5, overwrite: "auto"});
            --activeIconIndex;
            gsap.to(iconGroupGroup.children[activeIconIndex].scale, {x: ICON_SCALE, y: ICON_SCALE, z: 1, duration: 0.5, overwrite: "auto"});
            iconGroupGroup.children[activeIconIndex].userData.video.play();
            gsap.to(iconGroupGroup.position, {x: -iconGroupGroup.children[activeIconIndex].position.x, duration: 1, overwrite: "auto"});
            document.querySelector(".ProjectTitleText").textContent = iconGroupGroup.children[activeIconIndex].userData.title;
            document.querySelector(".ProjectDescriptionText").textContent = iconGroupGroup.children[activeIconIndex].userData.description;
            fadeDOMIconGlow(iconGroupGroup.children[activeIconIndex].userData.video.src);
            break;
          case document.querySelector(".Button5"):
            diveIn(iconGroupGroup.children[activeIconIndex].userData.html);
            break;
          case document.querySelector(".Button6"):
            iconGroupGroup.children[activeIconIndex].userData.video.pause();
            gsap.to(iconGroupGroup.children[activeIconIndex].scale, {x: ICON_SCALE / 1.5, y: ICON_SCALE / 1.5, z: 1, duration: 0.5, overwrite: "auto"});
            ++activeIconIndex;
            gsap.to(iconGroupGroup.children[activeIconIndex].scale, {x: ICON_SCALE, y: ICON_SCALE, z: 1, duration: 0.5, overwrite: "auto"});
            iconGroupGroup.children[activeIconIndex].userData.video.play();
            gsap.to(iconGroupGroup.position, {x: -iconGroupGroup.children[activeIconIndex].position.x, duration: 1, overwrite: "auto"});
            document.querySelector(".ProjectTitleText").textContent = iconGroupGroup.children[activeIconIndex].userData.title;
            document.querySelector(".ProjectDescriptionText").textContent = iconGroupGroup.children[activeIconIndex].userData.description;
            fadeDOMIconGlow(iconGroupGroup.children[activeIconIndex].userData.video.src);
            break;
        }
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
      case DOMHover === document.querySelector(".Filter2Div") && filterButtonsActive:
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
      case DOMHover === document.querySelector(".Filter3Div") && filterButtonsActive:
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

    if (raycastResult) {
      switch (true) {
        case raycastResult.name === "IconHitbox":
          const iconGroup = raycastResult.parent;
          if (iconGroup.userData.tl && iconGroup.userData.tl.isActive()) {
            iconGroup.userData.tl.kill();
          }
          const tl = gsap.timeline();
          iconGroup.userData.tl = tl;
          tl.to(iconGroup.scale, {x: ICON_SCALE / 1.5, y: ICON_SCALE / 1.5, z: 1, duration: 0.5, overwrite: "auto"})
            .to(iconGroup.position, {z: -0.15, duration: 0.5, overwrite: true}, "<")
            .to(iconGroup.userData.iconHover.material, {opacity: 0, duration: 1, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.repeat, {x: iconGroup.userData.screenTextureRepeatX, y: 1, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.offset, {x: iconGroup.userData.screenTextureOffsetX, y: 0, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material, {opacity: 1, duration: 1, overwrite: "auto"}, "<").call(() => {
            animationLock = null;
          }, null, ">");
          document.body.style.cursor = "default";
          userLock = true;
          gsap.to(iconGroup.position, {x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto"});
          gsap.to(iconGroup.scale, {x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto"});
          diveIn(iconGroup.userData.html);
          break;
      }
    }
  }
})

window.addEventListener("mouseup", () => {
  mouseDown = false;
  if (clickedDOM)
    clickedDOM = null;
  if (dragging && !userLock) {
    switch (true) {
      case dragging.name === "IconGroup":
        break;
    }
    dragging = null;
  }});

window.addEventListener("resize", () => {
  if (userLock && !MOBILE_USER)
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
  cameraWrapper.centeredTopDiv.style.width = `${newWidth}px`;
  cameraWrapper.centeredTopDiv.style.height = `${newHeight}px`;
  cameraWrapper.centeredTopDiv.style.fontSize = `${newWidth / DEFAULT_FONT_SIZE}px`;
  cameraWrapper.centeredBottomDiv.style.width = `${newWidth}px`;
  cameraWrapper.centeredBottomDiv.style.height = `${newHeight}px`;
  cameraWrapper.centeredBottomDiv.style.fontSize = `${newWidth / DEFAULT_FONT_SIZE}px`;

  divPositionMultiplier = newWidth * MAGIC_DIV_OFFSET;

  const divRect = cameraWrapper.centeredTopDiv.getBoundingClientRect();

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

function scrollTrigger() {

  //ICONS
  switch (true) {
    case scrollYWrapper.y === 0 && activeSection !== Sections.START:
      printDebug("activeSection set to START");
      activeSection = Sections.START;
      gsap.to(".ProjectsGroup", {opacity: 0, filter: "blur(1vh)", duration: 0.5, overwrite: "auto"});
      gsap.to(root.position, {y: "+=0.02", duration: 10, yoyo: true, repeat: -1, ease: "sine.inOut", overwrite: "auto"});
      gsap.to(root.rotation, {x: `+=${Math.PI * -5 / 180}`, duration: 10, yoyo: true, repeat: -1, ease: "sine.inOut", overwrite: "auto"});
      gsap.to(root.rotation, {y: `+=${Math.PI * 5 / 180}`, duration: 20, yoyo: true, repeat: -1, ease: "sine.inOut", overwrite: "auto"});
      gsap.to(root.rotation, {z: `+=${Math.PI * 30 / 180}`, duration: 30, yoyo: true, repeat: -1, ease: "sine.inOut", overwrite: "auto"});
      break;
    case scrollYWrapper.y > 0 && scrollYWrapper.y < 0.2 && activeSection === Sections.START:
      printDebug("activeSection set to HOME (IN)");
      activeSection = Sections.HOME;
      gsap.killTweensOf(cube.position);
      gsap.killTweensOf(cube.rotation);
      relativeRootPosition.copy(root.position);
      relativeRootRotation.copy(root.rotation);
      printDebug("relativeRoot set");
      gsap.to(".TitleFrameDiv", {opacity: 1, duration: 0.5, overwrite: "auto"});
      break;
    case scrollYWrapper.y > 0 && scrollYWrapper.y < 0.2 && (activeSection === Sections.PROJECTS || activeSection === Sections.TRANSITION1):
      printDebug("activeSection set to HOME (OUT)");
      activeSection = Sections.HOME;
      gsap.killTweensOf(root.position);
      gsap.killTweensOf(root.rotation);
      relativeRootPosition.copy(ROOT_START_POSITION);
      relativeRootRotation.copy(ROOT_START_ROTATION);
      printDebug("relativeRoot reset");
      removeIcons();
      gsap.to(".ProjectsGroup", {opacity: 0, filter: "blur(1vh)", duration: 0.5, overwrite: "auto"});
      gsap.to(cube.scale, {x: 1, y: 1, z: 1, duration: 0.5, overwrite: "auto"});
      break;
    case scrollYWrapper.y > 0.2 && activeSection === Sections.HOME:
      printDebug("activeSection set to TRANSITION1");
      activeSection = Sections.TRANSITION1;
      const tl1 = gsap.timeline();
      tl1.to(cube.position, {y: "-=0.01", duration: 0.1, overwrite: "auto"}).to(cube.position, {y: "+=0.01", duration: 0.1, overwrite: "auto"});
      const tl2 = gsap.timeline();
      tl2.to(cube.rotation, {x: `-=${Math.PI * 2 / 180}`, duration: 0.1, overwrite: "auto"}).to(cube.rotation, {x: `+=${Math.PI * 2 / 180}`, duration: 0.1, overwrite: "auto"});
      gsap.to(".TitleFrameDiv", {opacity: 0, duration: 0.5, overwrite: "auto"});
      break;
    case scrollYWrapper.y > 0.3 && scrollYWrapper.y < 0.6 && activeSection !== Sections.PROJECTS:
      printDebug("activeSection set to PROJECTS");
      activeSection = Sections.PROJECTS;
      spawnIcons();
      gsap.to(".ProjectsGroup", {opacity: 1, filter: "blur(0vh)", duration: 0.5, overwrite: "auto"});
      gsap.to(cube.scale, {x: 0, y: 0, z: 0, duration: 0.2, overwrite: "auto"});
      break;
    case scrollYWrapper.y > 0.6 && activeSection !== Sections.ABOUT:
      printDebug("activeSection set to ABOUT");
      activeSection = Sections.ABOUT;
      removeIcons();
  }

  //SCROLL BUTTON
  const scrollButtonStart = 0;
  const scrollButtonEnd = 1;
  let scrollButtonState = (scrollYWrapper.y - scrollButtonStart) / (scrollButtonEnd - scrollButtonStart);
  gsap.set(".ScrollButton", {top: `${scrollButtonState * 92 + 4}%`, overwrite: "auto"});


  //FILTER BUTTONS
  const filterTextDivDivStart = 0.3;
  const filterTextDivDivEnd = 0.5;
  let filterTextDivDivState = (scrollYWrapper.y - filterTextDivDivStart) / (filterTextDivDivEnd - filterTextDivDivStart);
  switch (true) {
    case scrollYWrapper.y < filterTextDivDivStart: filterTextDivDivState = 0; break;
    case scrollYWrapper.y > filterTextDivDivEnd: filterTextDivDivState = 1; break;
  }
  document.querySelectorAll(".ProjectsGroup").forEach((element) => {
    //element.style.opacity = filterTextDivDivState;
    //element.style.filter = `blur(${(1 - filterTextDivDivState) * 5}vh)`;
  });

  //GLASS OPACITY
  const iconScreenStart = 0.3;
  const iconScreenEnd = 0.4;
  let iconScreenState = (iconScreenEnd - scrollYWrapper.y) / (iconScreenEnd - iconScreenStart);
  switch (true) {
    case scrollYWrapper.y < iconScreenStart: iconScreenState = 1; break;
    case scrollYWrapper.y > iconScreenEnd: iconScreenState = 0; break;
  }
  glassMaterial.opacity = iconScreenState / 2;

  //LAPTOP GLOW && ROOT ANIMATION
  {
    const start = 0;
    const end = 0.2;
    let state = (end - scrollYWrapper.y) / (end - start);
    switch (true) {
      case scrollYWrapper.y < start: state = 1; break;
      case scrollYWrapper.y > end: state = 0; break;
    }
    gsap.set(".VideoPlayer1", {opacity: state, overwrite: "auto"});
    gsap.set(root.position, {x: state * relativeRootPosition.x, y: state * relativeRootPosition.y, z: state * relativeRootPosition.z, overwrite: "auto"});
    gsap.set(root.rotation, {x: Math.PI + (state * (relativeRootRotation.x - Math.PI)),
      y: Math.PI + (state * (relativeRootRotation.y - Math.PI)),
      z: Math.PI + (state * (relativeRootRotation.z - Math.PI)), overwrite: "auto"});
  }

  //LAPTOP HINGE
  //region
  const hingeStart = 0;
  const hingeEnd = 0.2;
  let hingeState = (hingeEnd - scrollYWrapper.y) / (hingeEnd - hingeStart);
  switch (true) {
    case scrollYWrapper.y < hingeStart: hingeState = 1; break;
    case scrollYWrapper.y > hingeEnd: hingeState = 0; break;
  }
  laptopHinge.rotation.x = hingeState * Math.PI * 115 / 180;
  //endregion

  //ABOUT FRAME
  const aboutStart = 0.8;
  const aboutEnd = 1;
  let aboutState = (scrollYWrapper.y - aboutStart) / (aboutEnd - aboutStart);
  switch (true) {
    case scrollYWrapper.y < aboutStart: aboutState = 0; break;
    case scrollYWrapper.y > aboutEnd: aboutState = 1; break;
  }
  gsap.set(".AboutFrameDiv", {opacity: aboutState, overwrite: "auto"});

  /*if (filterButtonsActive && filterButtonHover && !dragging && !userLock) {
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
  }*/
}

function scrollCameraBy(deltaY, duration) {
  const afterScroll = scrollYWrapper.y + deltaY;
  if (afterScroll <= 0) {
    gsap.to(scrollYWrapper, {y: 0, duration: duration, overwrite: true, onUpdate: scrollTrigger});
  }
  else if (afterScroll >= MAX_SCROLL) {
    gsap.to(scrollYWrapper, {y: MAX_SCROLL, duration: duration, overwrite: true, onUpdate: scrollTrigger});
  }
  else {
    gsap.to(scrollYWrapper, {y: `+=${deltaY}`, duration: duration, overwrite: true, onUpdate: scrollTrigger});
  }
}

function scrollCameraTo(Y, duration) {
  gsap.to(scrollYWrapper, {y: Y, duration: duration, overwrite: "auto", onUpdate: scrollTrigger});
}

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

function diveIn(html) {
  setTimeout(() => location.assign(`${html}.html`), 2000);
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
        iconGroup.object.position.copy(iconGroupSpawnerCurrentPosition);
        iconGroup.originalPosition = iconGroup.object.position.clone();
        iconGroupSpawnerCurrentPosition.x -= ICON_GAP_HORIZONTAL;
        iconGroupGroup.add(iconGroup.object);
        iconGroup.object.rotation.z = Math.PI / 4;
        gsap.to(iconGroup.object.rotation, {x: 0, y: 0, z: 0, duration: 0.3, ease: "back", overwrite: "auto"});
        gsap.to(iconGroup.object.scale, {x: ICON_SCALE / 1.5, y: ICON_SCALE / 1.5, z: 1, duration: 0.5, ease: "back(0.5)", overwrite: "auto"});
        gsap.to(iconGroupGroup.children[activeIconIndex].scale, {x: ICON_SCALE, y: ICON_SCALE, z: 1, duration: 0.5, ease: "back(0.5)", overwrite: "auto"});
      }
    });
  });
  gsap.set(iconGroupGroup.position, {x: -iconGroupGroup.children[activeIconIndex].position.x, overwrite: "auto"});
  document.querySelector(".ProjectTitleText").textContent = iconGroupGroup.children[activeIconIndex].userData.title;
  document.querySelector(".ProjectDescriptionText").textContent = iconGroupGroup.children[activeIconIndex].userData.description;
  switch (DOMIconGlowWrapper.activeIndex) {
    case 0: gsap.to(DOMIconGlowWrapper["1"], {opacity: 0.5, duration: 0.5, overwrite: "auto"}); break;
    case 1: gsap.to(DOMIconGlowWrapper["2"], {opacity: 0.5, duration: 0.5, overwrite: "auto"}); break;
  }
  fadeDOMIconGlow(iconGroupGroup.children[activeIconIndex].userData.video.src);
}

function removeIcons() {

  iconGroupGroup.children.forEach((child) => {
    gsap.killTweensOf(child.position);
    gsap.killTweensOf(child.scale);
    gsap.to(child.scale, {x: 0, y: 0, z: 0, duration: 0.2, overwrite: "auto", onComplete: () => {
        iconGroupGroup.remove(child);
      }
    });
    switch (DOMIconGlowWrapper.activeIndex) {
      case 0: gsap.to(DOMIconGlowWrapper["1"], {opacity: 0, duration: 0.5, overwrite: "auto"}); break;
      case 1: gsap.to(DOMIconGlowWrapper["2"], {opacity: 0, duration: 0.5, overwrite: "auto"}); break;
    }
  });
}

function onLoad() {
  gsap.set(cameraWrapper.camera.position, {z: -1, overwrite: "auto"});
  gsap.set(cameraWrapper.camera.rotation, {y: Math.PI, overwrite: "auto"});
  gsap.set(cameraWrapper.centeredTopDiv, {xPercent: -50, yPercent: -50, y: 0, overwrite: "auto"});
  gsap.set(cameraWrapper.centeredBottomDiv, {xPercent: -50, yPercent: -50, y: 0, overwrite: "auto"});
  gsap.to(".LoadingDiv", {opacity: 0, duration: 4, overwrite: "auto"});
  root.position.copy(ROOT_START_POSITION);
  root.rotation.copy(ROOT_START_ROTATION);
  relativeRootPosition.copy(ROOT_START_POSITION);
  relativeRootRotation.copy(ROOT_START_ROTATION);
  document.querySelector(".BackgroundVideo").src = "https://PortfolioPullZone.b-cdn.net/LandingPage/BackgroundStrip.webm";
  laptopVideo.src = playlist[0];
  laptopVideo.play();
  videoPlayer1.src = playlist[0];
  videoPlayer1.play();
  iconArray.forEach((child) => {child.video.play(); setTimeout(() => {child.video.pause()}, 1000)});
  finishedLoading = true;
  userLock = false;
  gsap.set(".LoadingDiv", {pointerEvents: "none", overwrite: "auto"});
  scrollTrigger();
}

function printDebug(log) {
  const div = document.querySelector(".Debug2");
  const line = new Error().stack.split("\n")[2].match(/:(\d+):\d+\)?$/)[1];
  if (div.innerHTML.length > 1000)
    gsap.set(div, {innerHTML: ""});
  else {
    gsap.set(div, {innerHTML: `${div.innerHTML}<br>${log} [${line}]`});
  }
}

function fadeDOMIconGlow(src) {
  switch (DOMIconGlowWrapper.activeIndex) {
    case 0:
      DOMIconGlowWrapper["2"].src = src;
      gsap.to(DOMIconGlowWrapper["1"], {opacity: 0, duration: 0.5, overwrite: "auto"});
      gsap.to(DOMIconGlowWrapper["2"], {opacity: 0.5, duration: 0.5, overwrite: "auto"});
      DOMIconGlowWrapper.activeIndex = 1;
      break;
    case 1:
      DOMIconGlowWrapper["1"].src = src;
      gsap.to(DOMIconGlowWrapper["1"], {opacity: 0.5, duration: 0.5, overwrite: "auto"});
      gsap.to(DOMIconGlowWrapper["2"], {opacity: 0, duration: 0.5, overwrite: "auto"});
      DOMIconGlowWrapper.activeIndex = 0;
      break;
  }
}

class Icon {
  constructor(type, videoPath, title, description, tags = [], html, bakedOverlayTexture) {
    this.type = type;
    this.title = title;
    this.description = description;
    this.html = html;
    this.object = iconComponentGroup.clone();
    this.object.scale.set(ICON_SCALE, ICON_SCALE, 1);
    this.object.userData = this;
    this.iconHitbox = this.object.children.find((child) => child.name === "IconHitbox");
    this.iconGlow = this.object.children.find((child) => child.name === "IconGlow");
    this.iconScreen = this.object.children.find((child) => child.name === "IconScreen");
    this.iconOverlay = this.object.children.find((child) => child.name === "IconOverlay");
    this.iconHover = this.object.children.find((child) => child.name === "IconHover");
    this.DOMTagArray = [];

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
      this.iconScreen.material = new THREE.MeshBasicMaterial({map: this.videoTexture});
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
      const h2cBackgroundDiv = document.querySelector(".h2cBackgroundDiv");
      const h2cForegroundDiv = document.querySelector(".h2cForegroundDiv");
      const h2cBorderDiv = document.querySelector(".h2cBorderDiv");
      Promise.all([
        html2canvas(h2cBackgroundDiv, {scale: 1, backgroundColor: null, useCORS: true, ignoreElements: (element) => element.tagName === "VIDEO", width: h2cBackgroundDiv.offsetWidth, height: h2cBackgroundDiv.offsetHeight}),
        html2canvas(h2cForegroundDiv, {scale: 1, backgroundColor: null, useCORS: true, ignoreElements: (element) => element.tagName === "VIDEO", width: h2cForegroundDiv.offsetWidth, height: h2cForegroundDiv.offsetHeight}),
        html2canvas(h2cBorderDiv, {scale: 1, backgroundColor: null, useCORS: true, ignoreElements: (element) => element.tagName === "VIDEO", width: h2cBorderDiv.offsetWidth, height: h2cBorderDiv.offsetHeight})
      ]).then(([backgroundCanvas, foregroundCanvas, borderCanvas]) => {

        let backgroundCompCanvas = document.createElement("canvas");
        backgroundCompCanvas.width = 1000;
        backgroundCompCanvas.height = 1000;

        backgroundCompCanvas.getContext("2d").drawImage(backgroundCanvas, 0, 0);

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

        if (EXPORT_TEXTURES) {
          const link = document.createElement("a");
          link.href = finalCompCanvas.toDataURL("image/png");
          link.download = title;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        backgroundCanvas = null;
        foregroundCanvas = null;
        borderCanvas = null;

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

    //TESTING
    let testincr = 0;
    tags.forEach((tag) => {
      if (this.type === projectType.PROGRAMMING) {
        const clonedTag = h2cTags["html"].cloneNode(true);
        clonedTag.style.opacity = 1;
        clonedTag.querySelector(".h2cTag").textContent = tag;
        clonedTag.style.left = `${testincr}%`;
        clonedTag.style.top = `-20%`;
        testincr += 20;
        this.DOMTagArray.push(clonedTag);
        document.querySelector(".ProjectInfoDiv").append(clonedTag);
      }
    })

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

const playlist = ["https://PortfolioPullZone.b-cdn.net/LandingPage/Reel/KineticRush2.webm", "https://PortfolioPullZone.b-cdn.net/LandingPage/Reel/ChasmsCall2.webm"];
let currentIndex = 0;
laptopVideo.addEventListener("ended", () => {
  if (++currentIndex < playlist.length) {
    laptopVideo.src = playlist[currentIndex];
    laptopVideo.play();
    videoPlayer1.src = playlist[currentIndex];
    videoPlayer1.play();
  } else {
    currentIndex = 0;
    laptopVideo.src = playlist[currentIndex];
    laptopVideo.play();
    videoPlayer1.src = playlist[currentIndex];
    videoPlayer1.play();
  }
});

laptopVideo.addEventListener("loadedmetadata", () => {
  const aspectRatio = laptopVideo.videoWidth / laptopVideo.videoHeight;
  gsap.set(laptopScreen.scale, {z: 1 / aspectRatio, overwrite: "auto"});
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
document.querySelectorAll(".MainButton").forEach((button) => {
  button.addEventListener("mouseenter", () => {
    gsap.to(button, {duration: 0.6, y: -6, scale: 1.02, boxShadow:"0 0 10px rgba(255, 255, 255, 0.9), inset 2px 2px 0 rgba(255, 255, 255, 0.2)", overwrite: "auto"});
  });
});
document.querySelectorAll(".MainButton").forEach((button) => {
  button.addEventListener("mouseleave", () => {
    gsap.to(button, {duration: 1, y: 0, scale: 1, boxShadow:"0 0 50px rgba(0, 0, 0, 0.9), inset 2px 2px 0 rgba(255, 255, 255, 0.2)", overwrite: "auto"});
  });
});

document.querySelectorAll(".MainButton").forEach((button) => {
  button.addEventListener("mouseenter", () => {DOMHover = button});
});
document.querySelectorAll(".MainButton").forEach((button) => {
  button.addEventListener("mouseleave", () => {DOMHover = null});
});
document.querySelector(".ScrollBarDiv").addEventListener("mouseenter", () => {DOMHover = document.querySelector(".ScrollBarDiv")});
document.querySelector(".ScrollBarDiv").addEventListener("mouseleave", () => {DOMHover = null});
//endregion

resize();