import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader.js";
import {gsap} from "gsap";
import html2canvas from "html2canvas";

//CONSTANTS
const MAIN_COLOR = {
  r: 67,
  g: 59,
  b: 255
}
const MAIN_COLOR_NORMALIZED = new THREE.Color(0x9EDFFF);
const MAGIC_DIV_OFFSET = 0.96;
const DEFAULT_FONT_SIZE = 10;
const ICON_GROUP_SPAWNER_INITIAL_POSITION = new THREE.Vector3(0.15, -0.36, 0);
const ICON_GAP_HORIZONTAL = 0.15;
const ICON_GAP_VERTICAL = ICON_GAP_HORIZONTAL;
const ICON_SCALE = 1.35;
const ICON_ROTATION = 0;
const MAX_SCROLL = 0.45;

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight
};
const cameraWrapper = {
  centeredDiv: document.querySelector(".CenteredDiv"),
  scrollDiv: document.querySelector(".ScrollDiv"),
  faceForegroundImage: document.querySelector(".FaceForegroundImage")
};

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

iconArray = [
  //new Icon(projectType.PROGRAMMING, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/KineticRush4.webm", "Kinetic Rush", "A running-themed community challenge", ["blender", "css", "photoshop"]),
  //new Icon(projectType.TECHNICAL_ART, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/ChasmsCall4.webm", "Project 2", "Description 2", ["blender", "js"]),
  //new Icon(projectType.ART, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/ChasmsCall4.webm", "Project 3", "Description 3", ["aftereffects"]),
  //new Icon(projectType.PROGRAMMING, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/ChasmsCall4.webm", "Project 4", "Description 4", ["css"])
];

//UTILITY
//region
let lastFrameTime = performance.now();
let fps = null;

const projectType = {
  PROGRAMMING: "programming",
  TECHNICAL_ART: "technicalArt",
  ART: "3D"
};
const activeFilters = {
  PROGRAMMING: true,
  TECHNICAL_ART: true,
  ART: true
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
let userLock = false;
let animationLock = null;

let divPositionMultiplier = null;

let portfolioButtonHover = false;
let portfolioButtonActive = true;

let filterButtonHover = false;
let filterButtonsActive = false;

let monitorPowered = true;
let monitorDivHover = false;
let monitorActive = false;
let scrollingDiscovered = false;
let scrollShowInterval = null;

let click = {
  target: null,
  time: performance.now()
};
let lastClick = null;

let finishedLoading = false;
//endregion

window.addEventListener("wheel", (event) => {
  if (!userLock)
    if (monitorDivHover && monitorPowered && monitorActive) {
      scrollMonitorBy(event.deltaY * 0.2, 0.5, true)
    }
    else
      scrollCameraBy(event.deltaY * 0.0007, 0.5);
});

window.addEventListener("mousemove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("mousedown", (event) => {
  event.preventDefault();
  if (!userLock) {
    mouseDown = true;
    if (raycastResult) {
      switch (true) {
        case raycastResult.parent.name === "IconGroup":
          const iconGroup = raycastResult.parent;
          click.target = iconGroup;
          click.time = performance.now();
          document.body.style.cursor = "grabbing";
          if (iconGroup.userData.tl && iconGroup.userData.tl.isActive()) {
            iconGroup.userData.tl.kill();
          }
          if (lastClick && lastClick.target === click.target && (click.time - lastClick.time) < 1000 && monitorPowered) {
            document.body.style.cursor = "default";
            userLock = true;
            animationLock = iconGroup;
            const tl = gsap.timeline();
            const slotDiv = document.querySelector(".Slot2Div");
            gsap.to(iconGroup.position, {x: 0, y: 0, z: -0.1, duration: 1, overwrite: "auto"});
            tl.to(iconGroup.scale, {x: 0, y: 0, z: 0, duration: 1, overwrite: "auto"}).to(slotDiv, {"--radius": "150%", duration: 1.5, overwrite: "auto"});
            playVideo();
          }
          else {
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
          }
          if (monitorPowered) {
            const homeSection = document.querySelector(".HomeSection");
            const aboutSection = document.querySelector(".AboutSection");
            const slotSection = document.querySelector(".SlotSection");
            gsap.to(homeSection, {opacity: 0, duration: 1});
            gsap.to(aboutSection, {opacity: 0, duration: 1});
            gsap.to(slotSection, {opacity: 1, duration: 1});
            if (!userLock)
              scrollCameraTo(0, 3);
          }
          else {
            const color2 = new THREE.Color(0xff0000);
            gsap.to(monitorButton.material.color, {r: color2.r, g: color2.g, b: color2.b, duration: 0.2, overwrite: "auto"});
          }
          dragging = iconGroup;
          lastClick = {target: click.target, time: click.time};
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
        if (dragging.position.distanceTo(monitorCover.position) < 0.25 && monitorPowered) {
          document.body.style.cursor = "default";
          userLock = true;
          animationLock = dragging;
          const tl = gsap.timeline();
          const slotDiv = document.querySelector(".Slot2Div");
          gsap.to(dragging.position, {x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto"});
          tl.to(dragging.scale, {x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto"}).to(slotDiv, {"--radius": "150%", duration: 1.5, overwrite: "auto"});
          playVideo();
        }
        else {
          document.body.style.cursor = "grab";
          const tl = gsap.timeline();
          tl.to(dragging.position, {x: dragging.userData.originalPosition.x, y: dragging.userData.originalPosition.y, duration: 0.5, ease: "back", overwrite: "auto"})
            .to(dragging.position, {z: dragging.userData.originalPosition.z, duration: 0.5, overwrite: "auto"});
          gsap.to(dragging.rotation, {x: 0, y: 0, z: 0, duration: 0.5, overwrite: "auto"});
          if (monitorPowered) {
            const homeSection = document.querySelector(".HomeSection");
            const aboutSection = document.querySelector(".AboutSection");
            const slotSection = document.querySelector(".SlotSection");
            if (monitorActive)
              gsap.to(aboutSection, {opacity: 1, duration: 1});
            else
              gsap.to(homeSection, {opacity: 1, duration: 1});
            gsap.to(slotSection, {opacity: 0, duration: 1});
            scrollCameraTo(-MAX_SCROLL, 3);
          }
          else {
            gsap.to(monitorButton.material.color, {r: 0, g: 0, b: 0, duration: 1, overwrite: "auto"});
          }
        }
        break;
    }
    dragging = null;
  }});

window.addEventListener("resize", () => {
  resize();
  scrollCameraTo(0, 0);
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
  camera.position.z = -0.9 * (screenSize.height / newHeight);
  camera.aspect = screenSize.width / screenSize.height;
  camera.updateProjectionMatrix();
}

function getMouseWorldPosition() {
  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(lookPlane, lookIntersection);
  return lookIntersection.clone();
}

function scrollTrigger() {

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
}

function scrollCameraBy(deltaY, duration) {
  const afterScroll = cameraWrapper.camera.position.y - deltaY;
  if (afterScroll >= 0) {
    gsap.to(cameraWrapper.camera.position, {y: 0, duration: duration, overwrite: true, onUpdate: scrollTrigger});
    gsap.to(cameraWrapper.centeredDiv, {y: 0, duration: duration, overwrite: true});
  }
  else if (afterScroll <= -MAX_SCROLL) {
    gsap.to(cameraWrapper.camera.position, {y: -MAX_SCROLL, duration: duration, overwrite: true, onUpdate: scrollTrigger});
    gsap.to(cameraWrapper.centeredDiv, {y: -MAX_SCROLL * divPositionMultiplier * gsap.getProperty(cameraWrapper.centeredDiv, "scale"), duration: duration, overwrite: true});
  }
  else {
    gsap.to(cameraWrapper.camera.position, {y: `-=${deltaY}`, duration: duration, overwrite: true, onUpdate: scrollTrigger});
    gsap.to(cameraWrapper.centeredDiv, {y: `-=${deltaY * divPositionMultiplier * gsap.getProperty(cameraWrapper.centeredDiv, "scale")}`, duration: duration, overwrite: true});
  }
}

function scrollCameraTo(Y, duration) {
  gsap.to(cameraWrapper.camera.position, {y: Y, duration: duration, overwrite: "auto", onUpdate: scrollTrigger});
  gsap.to(cameraWrapper.centeredDiv, {y: Y * divPositionMultiplier, duration: duration, overwrite: "auto"});
}

function scrollMonitorBy(deltaY, duration, boolean) {
  if (boolean && deltaY > 0) {
    scrollingDiscovered = true;
    clearInterval(scrollShowInterval);
    scrollShowInterval = null;
  }
  const afterScroll = cameraWrapper.scrollDiv.offsetTop / cameraWrapper.scrollDiv.parentElement.clientHeight * -100 + deltaY;
  if (afterScroll <= 0) {
    gsap.to(cameraWrapper.scrollDiv, {top: "0%", duration: duration, overwrite: "auto"});
    gsap.to(cameraWrapper.faceForegroundImage, {top: "71%", width: "30%", duration: duration, overwrite: "auto"});
  }
  else if (afterScroll >= 100) {
    gsap.to(cameraWrapper.scrollDiv, {top: "-100%", duration: duration, overwrite: "auto"});
    gsap.to(cameraWrapper.faceForegroundImage, {top: "46%", width: "35%", duration: duration, overwrite: "auto"});
  }
  else {
    gsap.to(cameraWrapper.scrollDiv, {top: `-=${deltaY}%`, duration: duration, overwrite: "auto"});
    gsap.to(cameraWrapper.faceForegroundImage, {top: `-=${deltaY / 4}%`, width: `+=${deltaY / 20}%`, duration: duration, overwrite: "auto"});
  }
}

function zoomCameraTo(scrollZ, duration) {
  const baseZoom = camera.position.z;
  gsap.to(camera.position, {z: scrollZ, duration: duration, ease: "power1.inOut", onUpdate: () => {
      const s = baseZoom / camera.position.z + (gsap.getProperty(cameraWrapper.centeredDiv, "scale") - 1) / 20;
      gsap.set(cameraWrapper.centeredDiv, {scale: s});
      }
  });
}

function playVideo() {
  scrollCameraTo(0, 1);
  zoomCameraTo(-0.35, 2)
  //setTimeout(() => window.open("project 1.html", "_self"), 2000);
}

function randomizePosition(object, minX, maxX, minY, maxY, minZ, maxZ) {
  object.position.x = randomValueBounds(minX, maxX);
  object.position.y = randomValueBounds(minY, maxY);
  object.position.z = randomValueBounds(minZ, maxZ);
}

function ambientAnimation(obj) {
  const positionDeviation = 0.3;
  const rotationDeviation = Math.PI * 3;
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
      }, 5000);
  }
  else {
    monitorActive = false;
    clearInterval(scrollShowInterval);
    scrollShowInterval = null;
  }
}

function placeIcons() {
  if (!iconGroupGroup.children.length) {
    spawnIcons();
  }
  else {
    filterButtonsActive = false;
    iconGroupGroup.children.forEach((child) => {
      gsap.killTweensOf(child.position);
      gsap.killTweensOf(child.scale);
      gsap.to(child.scale, {x: 0, y: 0, z: 0, duration: 0.2, overwrite: "auto", onComplete: () => {
          iconGroupGroup.remove(child);
          spawnIcons();
        }
      });
    });
  }
  iconGroupGroup.rotation.x = ICON_ROTATION;
  scene.add(iconGroupGroup);
}

function spawnIcons() {
  const iconGroupSpawnerCurrentPosition = ICON_GROUP_SPAWNER_INITIAL_POSITION.clone();
  iconArray.forEach((iconGroup) => {
    Object.keys(projectType).some((type) => {
      if (activeFilters[type] && iconGroup.type === projectType[type]) {
        gsap.killTweensOf(iconGroup.object.position);
        gsap.killTweensOf(iconGroup.object.scale);
        filterButtonsActive = true;
        if (filterButtonHover) {
          document.body.style.cursor = "pointer";
          gsap.to(filterButtonHover, {backgroundColor: "rgba(255, 255, 255, 0.1)", ease: "back", duration: 0.2});
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
    filterButtonsActive = true;
    if (filterButtonHover)
      document.body.style.cursor = "pointer";
  }
}

class Icon {
  constructor(type, videoPath, title, description, tags = []) {
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
    this.video.playsInline = true;
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
    gsap.set(document.querySelector(".testing"), {opacity: 1, duration: 1, overwrite: "auto"})
    console.log("loaded");
  }
}

//ON LOAD
//region
const videoPlayer = document.querySelector(".VideoPlayer");
const playlist = ["https://PortfolioPullZone.b-cdn.net/LandingPage/Reel/KineticRush2.webm", "https://PortfolioPullZone.b-cdn.net/LandingPage/Reel/ChasmsCall2.webm"];
gsap.to(".LoadingDiv", {opacity: 0, duration: 2});
document.querySelector(".testing2").addEventListener("click", () => {
  finishedLoading = true;
  document.querySelector(".BackgroundVideo").src = "https://PortfolioPullZone.b-cdn.net/LandingPage/Background.webm";
  document.querySelector(".BackgroundVideo").play();
  videoPlayer.src = playlist[0];
  videoPlayer.play();
  iconArray.forEach((child) => {child.video.play()});
});
gsap.set(cameraWrapper.centeredDiv, {xPercent: -50, yPercent: -50, y: 0});
resize();
//endregion

//VIDEO PLAYER
// region
let currentIndex = 0;
videoPlayer.addEventListener("ended", () => {
  if (++currentIndex < playlist.length) {
    videoPlayer.src = playlist[currentIndex];
    videoPlayer.play();
  } else {
    currentIndex = 0;
    videoPlayer.src = playlist[currentIndex];
    videoPlayer.play();
  }
});
//endregion

//MONITOR GLOW LOOP
//region
const obj = {value: 0};
gsap.to(obj, {value: 1, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut", onUpdate: () => {
    const alpha = obj.value;
    document.querySelector(".MonitorGlowDiv").style.setProperty("--bg", `rgba(${MAIN_COLOR.r}, ${MAIN_COLOR.g}, ${MAIN_COLOR.b}, ${alpha})`);
  }});
//endregion

//HOME SECTION HOVER
//region
document.querySelector(".MonitorDiv").addEventListener("mouseenter", () => {
  monitorDivHover = true;
  gsap.to(videoPlayer, {opacity: 0.5, duration: 0.2, overwrite: "auto"});
});
document.querySelector(".MonitorDiv").addEventListener("mouseleave", () => {
  monitorDivHover = false;
  gsap.to(videoPlayer, {opacity: 0.3, duration: 1, overwrite: "auto"});
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
document.querySelectorAll(".LogoDiv")[1].addEventListener("mouseenter", () => {
  document.body.style.cursor = "pointer";
});
document.querySelectorAll(".LogoDiv")[1].addEventListener("mouseleave", () => {
  document.body.style.cursor = "default";
});
document.querySelectorAll(".LogoDiv")[1].addEventListener("click", () => {
  window.open("https://pja.edu.pl/en/", "_blank");
});

//NAVIGATION BUTTONS
//region
const portfolioButtonDiv = document.querySelector(".PortfolioButtonDiv");
portfolioButtonDiv.addEventListener("click", () => {if (portfolioButtonActive && !userLock) {
  gsap.set(portfolioButtonDiv, {backgroundColor: "rgba(255, 255, 255, 0.15)", overwrite: "auto"});
  gsap.to(portfolioButtonDiv, {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.5, overwrite: "auto"});
  scrollCameraTo(-MAX_SCROLL, 3)
}});

const homeSection = document.querySelector(".HomeSection");
const aboutSection = document.querySelector(".AboutSection");

const homeButtonDiv = document.querySelector(".HomeButtonDiv");
homeButtonDiv.addEventListener("click", () => {
  if (portfolioButtonActive && !userLock) {
    gsap.set(homeButtonDiv, {backgroundColor: "rgba(255, 255, 255, 0.15)", overwrite: "auto"});
    gsap.to(homeButtonDiv, {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.5, overwrite: "auto"});
    monitorState(false);
    gsap.to(homeSection, {opacity: 1, duration: 0.5});
    gsap.to(aboutSection, {opacity: 0, duration: 0.5});
  }});

const aboutButtonDiv = document.querySelector(".AboutButtonDiv");
aboutButtonDiv.addEventListener("click", () => {
  if (portfolioButtonActive && !userLock) {
    gsap.set(aboutButtonDiv, {backgroundColor: "rgba(255, 255, 255, 0.15)", overwrite: "auto"});
    gsap.to(aboutButtonDiv, {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.5, overwrite: "auto"});
    monitorState(true);
    gsap.to(aboutSection, {opacity: 1, duration: 0.5});
    gsap.to(homeSection, {opacity: 0, duration: 0.5})
  }
});
//endregion

//FILTER BUTTONS
//region
const filter1ButtonDiv = document.querySelector(".Filter1Div");
filter1ButtonDiv.addEventListener("click", () => {
if (filterButtonsActive) {
  gsap.set(filter1ButtonDiv, {backgroundColor: "rgba(255, 255, 255, 0.15)", overwrite: "auto"});
  gsap.to(filter1ButtonDiv, {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.5, overwrite: "auto"});
  const filterIcon1Div = document.querySelectorAll(".FilterIcon1Div");
  if (activeFilters.PROGRAMMING) {
    activeFilters.PROGRAMMING = false;
    filterIcon1Div.forEach((child) => {child.style.backgroundColor = "rgba(255, 255, 255, 0.05)"});
  }
else {
    activeFilters.PROGRAMMING = true;
    filterIcon1Div.forEach((child) => {child.style.backgroundColor = "lightgreen"});
  }
  placeIcons();
}
});
const filter2ButtonDiv = document.querySelector(".Filter2Div");
filter2ButtonDiv.addEventListener("click", () => {
  if (filterButtonsActive) {
    gsap.set(filter2ButtonDiv, {backgroundColor: "rgba(255, 255, 255, 0.15)", overwrite: "auto"});
    gsap.to(filter2ButtonDiv, {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.5, overwrite: "auto"});
    const filterIcon2Div = document.querySelectorAll(".FilterIcon2Div");
    if (activeFilters.TECHNICAL_ART) {
      activeFilters.TECHNICAL_ART = false;
      filterIcon2Div.forEach((child) => {child.style.backgroundColor = "rgba(255, 255, 255, 0.05)"});
    }
    else {
      activeFilters.TECHNICAL_ART = true;
      filterIcon2Div.forEach((child) => {child.style.backgroundColor = "yellow"});
    }
    placeIcons();
  }
});
const filter3ButtonDiv = document.querySelector(".Filter3Div");
filter3ButtonDiv.addEventListener("click", () => {
  if (filterButtonsActive) {
    gsap.set(filter3ButtonDiv, {backgroundColor: "rgba(255, 255, 255, 0.15)", overwrite: "auto"});
    gsap.to(filter3ButtonDiv, {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.5, overwrite: "auto"});
    const filterIcon3Div = document.querySelectorAll(".FilterIcon3Div");
    if (activeFilters.ART) {
      activeFilters.ART = false;
      filterIcon3Div.forEach((child) => {child.style.backgroundColor = "rgba(255, 255, 255, 0.05)"});
    }
    else {
      activeFilters.ART = true;
      filterIcon3Div.forEach((child) => {child.style.backgroundColor = "lightcoral"});
    }
    placeIcons();
  }
});

[homeButtonDiv, portfolioButtonDiv, aboutButtonDiv].forEach(button => {
  button.addEventListener("mouseenter", () => {
    portfolioButtonHover = button;
    if (portfolioButtonActive && !dragging && !userLock) {
      document.body.style.cursor = "pointer";
      gsap.to(button, {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.2, overwrite: "auto"});
    }});
  button.addEventListener("mouseleave", () => {
    portfolioButtonHover = null;
    if (!dragging) {
      document.body.style.cursor = "default";
      gsap.to(button, { backgroundColor: "rgba(255, 255, 255, 0.05)", duration: 0.2, overwrite: "auto"});
    }
  });
});

[filter1ButtonDiv, filter2ButtonDiv, filter3ButtonDiv].forEach((button) => {
  button.addEventListener("mouseenter", () => {
    filterButtonHover = button;
    if (filterButtonsActive && !dragging && !userLock) {
      document.body.style.cursor = "pointer";
      gsap.to(button, {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.2, overwrite: "auto"});
    }});
  button.addEventListener("mouseleave", () => {
    filterButtonHover = null;
    gsap.to(button, {backgroundColor: "rgba(255, 255, 255, 0.05)", duration: 0.2, overwrite: "auto"});
    if (!portfolioButtonActive && !dragging && !userLock) {
      document.body.style.cursor = "default";
    }
  });
});
//endregion