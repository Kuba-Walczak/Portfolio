import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader.js";
import {gsap} from "gsap";
import html2canvas from "html2canvas";

//CONSTANTS
const mainColorNormalized = new THREE.Color(0x9EDFFF);
const mainColor = {
  r: 67,
  g: 59,
  b: 255
}
const magicDivOffset = 0.96;
const defaultFontsize = 10;
const iconGroupSpawnerInitialPosition = new THREE.Vector3(0.15, -0.36, 0);
const iconGapHorizontal = 0.15;
const iconGapVertical = iconGapHorizontal;
const iconScale = 1.35;
const iconRotation = 0;
const maxScroll = 0.45;

//THREE JS SETUP
//region
const scene = new THREE.Scene();
const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight
};
const camera = new THREE.PerspectiveCamera( 35.98339890412515, screenSize.width / screenSize.height, 0.01, 1000);
camera.position.z = -0.9;
camera.rotation.y = Math.PI;
const cameraWrapper = {
  camera: camera,
  centeredDiv: document.querySelector(".CenteredDiv"),
  scrollDiv: document.querySelector(".ScrollDiv"),
  faceForegroundImage: document.querySelector(".FaceForegroundImage")
};
const canvas = document.querySelector(".test");
const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, preserveDrawingBuffer: true});
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(render);
const loaderManager = new THREE.LoadingManager(() => {
  renderer.compile(scene, camera);
  gsap.to(".LoadingDiv", {opacity: 0, duration: 2});
})
camera.updateProjectionMatrix();
scene.updateMatrixWorld(true);

//CAMERA CONTROLS (DISABLED)
/*import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
document.body.appendChild(renderer.domElement);
const orbitControls = new OrbitControls( camera, renderer.domElement );
orbitControls.update();*/

//SETUP TEXTURE LOADER
const textureLoader = new THREE.TextureLoader(loaderManager);

//SETUP MODEL LOADER
//region
const loader = new GLTFLoader(loaderManager);
const dracoLoader = new DRACOLoader(loaderManager);
dracoLoader.setDecoderPath("/public/draco/");
loader.setDRACOLoader(dracoLoader);
//endregion

//LOAD CUSTOM TEXTURES
//region
const cubeMap = new THREE.CubeTextureLoader().setPath("public/Main/Textures/HDRI/").load(["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"]);

const textureBake = textureLoader.load("/public/Main/Textures/Texture.webp");
textureBake.flipY = false;
textureBake.colorSpace = THREE.SRGBColorSpace;
textureBake.minFilter = THREE.LinearFilter;
textureBake.magFilter = THREE.LinearFilter;

const glassMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  envMap: cubeMap,
  metalness: 1,
  roughness: 0.15,
  transparent: true,
  opacity: 0.3,
});
//endregion

//CREATE SCENE VARIABLES
let monitorCover = null;
let monitorButton = null;
let monitorMask = null;
let monitorPowered = true;

//SPAWN SCENE (static, no raycast)
loader.load("/public/Main/Models/SceneCompressed.glb", (glb) => {
  glb.scene.traverse((child) => {
    switch (true) {
      case child.name === "Monitor":
        child.material = new THREE.MeshBasicMaterial({map: textureBake});
        break;
      case child.name === "MonitorCover":
        child.material = new THREE.MeshBasicMaterial({color: 0x000000, visible: false});
        monitorCover = child;
        break;
      case child.name === "MonitorButton":
        child.material = new THREE.MeshBasicMaterial({color: mainColorNormalized});
        monitorButton = child;
        raycastTargetArray.push(child);
        break;
      case child.name === "MonitorMask":
        child.material = new THREE.MeshBasicMaterial({colorWrite: false});
        monitorMask = child;
        break;
    }
  });
  scene.add(glb.scene);
});

//CREATE ASSET VARIABLES (manually created and placed, raycast enabled)
let iconComponentGroup = new THREE.Group();
let raycastTargetArray = [];
let primitiveArray = [];
const projectType = {
  PROGRAMMING: "programming",
  TECHNICAL_ART: "technicalArt",
  ART: "3D"
};
let iconArray = [];
let iconGroupGroup = new THREE.Group();
const activeFilters = {
  PROGRAMMING: true,
  TECHNICAL_ART: true,
  ART: true
};
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
  //tag.style.background = `radial-gradient(circle at 50% 0%, ${window.getComputedStyle(tag).backgroundColor}, rgba(255, 255, 255, 0.1))`;
});
let portfolioButtonActive = true;
let filterButtonsActive = false;

//SPAWN ASSETS
loader.load("/public/Main/Models/AssetsCompressed.glb", (glb) => {
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
      case child.name.includes("Wireframe"):
        child.material = new THREE.MeshBasicMaterial({color: mainColorNormalized, opacity: 0.03, transparent: true});
        for (let i = 0; i < 15; ++i) {
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
  iconArray = [
    new Icon(projectType.PROGRAMMING, "public/Kinetic Rush/KineticRushSubmission.mp4", "Kinetic Rush", "A running-themed community challenge", ["blender", "css", "photoshop"]),
    new Icon(projectType.TECHNICAL_ART, "public/output.mp4", "Project 2", "Description 2", ["blender", "js"]),
    new Icon(projectType.ART, "public/Blackwall1001-1030.mp4", "Project 3", "Description 3", ["aftereffects"]),
    new Icon(projectType.PROGRAMMING, "public/output.mp4", "Project 4", "Description 4", ["css"])
  ];
  placeIcons();
  scrollTrigger();

  primitiveArray.forEach((primitive) => {
    if (Math.random() > 0.8)
      randomizePosition(primitive, -1, 1, -1, 0.5,0.2, 3);
    else
      randomizePosition(primitive, -1, 1, -1, 0.5,0.2, 3);
    ambientAnimation(primitive);
    scene.add(primitive);
  });
});

//UTILITY
let lastFrameTime = performance.now();
let fps = null;
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
let monitorDivHover = false;
let portfolioButtonHover = false;
let filterButtonHover = false;
let monitorActive = false;

function render() {
  if (!userLock) {
    raycaster.setFromCamera(pointer, camera);
    const raycast = raycaster.intersectObjects(raycastTargetArray, true);
    if (raycast.length) {
      raycastResult = raycast[0].object;
      switch (true) {
        case raycastResult.parent.name === "IconGroup" && (raycastResult.parent === dragging || !dragging):
          const targetMatrix = new THREE.Matrix4().lookAt(raycastResult.parent.position, getMouseWorldPosition(), raycastResult.parent.up);
          targetMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
          targetMatrix.multiply(new THREE.Matrix4().makeRotationX(-iconRotation));
          const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(targetMatrix);
          gsap.to(raycastResult.parent.quaternion, {x: targetQuaternion.x, y: targetQuaternion.y, z: targetQuaternion.z, w: targetQuaternion.w, duration: 0.5});
          break;
      }
    }
    else if (!mouseDown && previousRaycastResult) {
      document.body.style.cursor = "default";
      raycastResult = null;
    }
    if (dragging) {
      raycaster.ray.intersectPlane(plane, intersection);
      const target = intersection.clone().sub(offset);
      gsap.to(dragging.position, {x: target.x, y: target.y, duration: 0.3});
      switch (true) {
        case dragging.name === "IconGroup":
          if (dragging.position.distanceTo(monitorCover.position) < 0.25 && monitorPowered) {
            gsap.killTweensOf(dragging.scale);
            gsap.to(dragging.scale, {x: iconScale / 2, y: iconScale / 2, z: 1, duration: 0.1});
            gsap.to(dragging.rotation, {x: -iconRotation, y: 0, z: 0, duration: 1});
          }
          else {
            gsap.killTweensOf(dragging.scale);
            gsap.to(dragging.scale, {x: iconScale, y: iconScale, z: 1, duration: 0.1});
          }
          break;
      }
    }

    //HOVER ENTER/LEAVE
    else if (raycastResult !== previousRaycastResult && !mouseDown) {

      if (previousRaycastResult) {
        switch (true) {
          case previousRaycastResult.parent.name === "IconGroup" && previousRaycastResult.parent !== animationLock:
            const iconGroup = previousRaycastResult.parent;
            const tempTl = iconGroup.userData.tl;
            if (tempTl && tempTl.time() >= tempTl.labels["selected"])
              animationLock = iconGroup;
            if (iconGroup.userData.tl && iconGroup.userData.tl.isActive()) {
              iconGroup.userData.tl.kill();
            }
            const tl = gsap.timeline();
            iconGroup.userData.tl = tl;
            tl.to(iconGroup.scale, {x: iconScale, y: iconScale, z: 1, duration: 0.5, overwrite: "auto"})
            .to(iconGroup.userData.iconHover.material, {opacity: 0, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.repeat, {x: iconGroup.userData.screenTextureRepeatX, y: 1, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.offset, {x: iconGroup.userData.screenTextureOffsetX, y: 0, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.rotation, {x:iconRotation, y: 0, z: 0, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material, {opacity: 0.5, duration: 0.5, overwrite: "auto"}, "<").call(() => {
              animationLock = null;
            }, null, ">")
            .to(iconGroup.userData.iconOverlay.material, {opacity: 1, duration: 1, overwrite: "auto"}, "<")
            .to(iconGroup.position, {z: iconGroup.userData.originalPosition.z, duration: 0.5, overwrite: "auto"}, "<");
            /*iconGroupGroup.children.forEach((child) => {
              if (child !== iconGroup) {
                gsap.to(child.position, {z: iconGroupSpawnerInitialPosition.z, duration: 1, overwrite: "auto"});
              }
            });*/
            break;
          case previousRaycastResult.name === "MonitorButton" && monitorPowered:
            gsap.to(monitorButton.material.color, {r: mainColorNormalized.r, g: mainColorNormalized.g, b: mainColorNormalized.b, duration: 1, overwrite: "auto"});
            break;
        }
      }

      if (raycastResult) {
        switch (true) {
          case raycastResult.parent.name === "IconGroup" && raycastResult.parent === animationLock:
            document.body.style.cursor = "grab";
            break;
          case raycastResult.parent.name === "IconGroup" && raycastResult.parent !== animationLock:
            document.body.style.cursor = "grab";
            const iconGroup = raycastResult.parent;
            if (iconGroup.userData.tl && iconGroup.userData.tl.isActive())
              iconGroup.userData.tl.kill();
            const tl = gsap.timeline();
            iconGroup.userData.tl = tl;
            tl.to(iconGroup.userData.iconHover.material, {opacity: 1, duration: 1}).addLabel("selected").call(() => {
              /*iconGroupGroup.children.forEach((child) => {
                if (child !== iconGroup) {
                  gsap.to(child.position, {z: 0.1, duration: 1, overwrite: "auto"});
                }
              });*/
            })
            .to(iconGroup.position, {z: -0.1, duration: 0.5, overwrite: "auto"}, ">")
            .to(iconGroup.scale, {x: iconScale * iconGroup.userData.aspectRatio, duration: 1, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.repeat, {x: 1, y: 1, duration: 1, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.offset, {x: 0, y: 0, duration: 1, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material, {opacity: 1, duration: 1, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconOverlay.material, {opacity: 0, duration: 0.1, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconHover.material, {opacity: 0, duration: 0.1, overwrite: "auto"}, "<");
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
  /*if (fps.toFixed(1) < 100)
    console.log(fps.toFixed(1));*/

  renderer.render(scene, camera);

}

//END OF THREE JS SETUP
//endregion

window.addEventListener("wheel", (event) => {
  if (!userLock)
    if (monitorDivHover && monitorPowered && monitorActive) {
      scrollMonitorBy(event.deltaY * 0.2, 0.5)
    }
    else
      scrollCameraBy(event.deltaY * 0.001, 0.5);
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
          iconGroup.userData.tl.kill();
          document.body.style.cursor = "grabbing";
          if (iconGroup.userData.tl && iconGroup.userData.tl.isActive()) {
            iconGroup.userData.tl.kill();
          }
          const tl = gsap.timeline();
          iconGroup.userData.tl = tl;
          tl.to(iconGroup.scale, {x: iconScale / 1.5, y: iconScale / 1.5, z: 1, duration: 0.5, overwrite: "auto"})
            .to(iconGroup.position, {z: -0.1, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconHover.material, {opacity: 0, duration: 1, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconOverlay.material, {opacity: 1, duration: 1, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.repeat, {x: iconGroup.userData.screenTextureRepeatX, y: 1, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material.map.offset, {x: iconGroup.userData.screenTextureOffsetX, y: 0, duration: 0.5, overwrite: "auto"}, "<")
            .to(iconGroup.userData.iconScreen.material, {opacity: 0.5, duration: 1, overwrite: "auto"}, "<").call(() => {
            animationLock = null;
          }, null, ">");
          /*iconGroupGroup.children.forEach((child) => {
            if (child !== iconGroup) {
              gsap.to(child.position, {z: 0.1, duration: 1, overwrite: "auto"});
            }
          });*/
          if (monitorPowered) {
            const homeSection = document.querySelector(".HomeSection");
            const slotSection = document.querySelector(".SlotSection");
            gsap.to(homeSection, {opacity: 0, duration: 1});
            gsap.to(slotSection, {opacity: 1, duration: 1});
            scrollCameraTo(0, 3);
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
  if (dragging) {
    switch (true) {
      case dragging.name === "IconGroup":
        if (dragging.position.distanceTo(monitorCover.position) < 0.25 && monitorPowered) {
          document.body.style.cursor = "default";
          userLock = true;
          animationLock = dragging;
          const tl = gsap.timeline();
          const slotDiv = document.querySelector(".Slot2Div");
          gsap.to(dragging.position, {x: 0, y: 0, z: 0, duration: 0.5, ease: "back"});
          tl.to(dragging.scale, {x: 0, y: 0, z: 0, duration: 0.5, ease: "back"}).to(slotDiv, {"--radius": "150%", duration: 1.5});
          //gsap.to(dragging.scale, {x: 1, y: 1, z: 1, duration: 0.1});
          //gsap.to(dragging.rotation, {x:0, y: 0, z: 0, duration: 1});
          playVideo();
        }
        else {
          document.body.style.cursor = "grab";
          const tl = gsap.timeline();
          tl.to(dragging.position, {x: dragging.userData.originalPosition.x, y: dragging.userData.originalPosition.y, duration: 0.5, ease: "back"})
            .to(dragging.position, {z: dragging.userData.originalPosition.z, duration: 0.5});
          gsap.to(dragging.rotation, {x:0, y: 0, z: 0, duration: 0.5});
          /*iconGroupGroup.children.forEach((child) => {
            if (child !== dragging) {
              gsap.to(child.position, {z: iconGroupSpawnerInitialPosition.z, duration: 1, overwrite: "auto"});
            }
          });*/
          if (monitorPowered) {
            const homeSection = document.querySelector(".HomeSection");
            const slotSection = document.querySelector(".SlotSection");
            gsap.to(homeSection, {opacity: 1, duration: 1});
            gsap.to(slotSection, {opacity: 0, duration: 1});
            scrollCameraTo(-0.45, 3);
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
  cameraWrapper.centeredDiv.style.fontSize = `${newWidth / defaultFontsize}px`;

  divPositionMultiplier = newWidth * magicDivOffset;

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

  const cameraPositionNormalized = Math.min(1, Math.max(0, -camera.position.y / maxScroll));

  //PORTFOLIO BUTTON TEXT
  const portfolioButtonTextDiv = document.querySelector(".PortfolioButtonTextDiv");
  const portfolioButtonTextStart = 0;
  const portfolioButtonTextEnd = 0.7;
  let portfolioButtonTextState = (portfolioButtonTextEnd - cameraPositionNormalized) / (portfolioButtonTextEnd - portfolioButtonTextStart);
  switch (true) {
    case cameraPositionNormalized < portfolioButtonTextStart: {
      portfolioButtonTextState = 1;
      break;
    }
    case cameraPositionNormalized > portfolioButtonTextEnd: {
      portfolioButtonTextState = 0;
      break;
    }
  }
  portfolioButtonTextDiv.style.opacity = portfolioButtonTextState;
  portfolioButtonTextDiv.style.filter = `blur(${(1 - portfolioButtonTextState) * 5}vh)`;
  portfolioButtonActive = portfolioButtonTextState > 0.9;

  //PORTFOLIO BUTTON
  const portfolioButtonDiv = document.querySelector(".PortfolioButtonDiv");
  const portfolioButtonDivStart = 0;
  const portfolioButtonDivEnd = 0.4;
  let portfolioButtonDivState = (cameraPositionNormalized - portfolioButtonDivStart) / (portfolioButtonDivEnd - portfolioButtonDivStart);
  switch (true) {
    case cameraPositionNormalized < portfolioButtonDivStart: portfolioButtonDivState = 0; break;
    case cameraPositionNormalized > portfolioButtonDivEnd: portfolioButtonDivState = 1; break;
  }
  portfolioButtonDiv.style.width = `${(portfolioButtonDivState * 18.5) + 30}%`;

  //ICON BUTTON TEXT
  const homeButtonDiv = document.querySelector(".HomeButtonDiv");
  const aboutButtonDiv = document.querySelector(".AboutButtonDiv");
  const homeButtonIconStart = 0.3;
  const homeButtonIconEnd = 0.5;
  let homeButtonIconState = (homeButtonIconEnd - cameraPositionNormalized) / (homeButtonIconEnd - homeButtonIconStart);
  switch (true) {
    case cameraPositionNormalized < homeButtonIconStart: {
      homeButtonIconState = 1;
      break;
    }
    case cameraPositionNormalized > homeButtonIconEnd: {
      homeButtonIconState = 0;
      break;
    }
  }
  homeButtonDiv.style.opacity = homeButtonIconState;
  homeButtonDiv.style.filter = `blur(${(1 - homeButtonIconState)}vh)`;
  portfolioButtonActive = portfolioButtonDivState < 0.1;
  aboutButtonDiv.style.opacity = homeButtonIconState;
  aboutButtonDiv.style.filter = `blur(${(1 - homeButtonIconState)}vh)`;

  //FILTER BUTTONS
  const filterTextDivDiv = document.querySelector(".FilterDivDiv");
  const filterTextDivDivStart = 0.3;
  const filterTextDivDivEnd = 0.7;
  let filterTextDivDivState = (cameraPositionNormalized - filterTextDivDivStart) / (filterTextDivDivEnd - filterTextDivDivStart);
  switch (true) {
    case cameraPositionNormalized < filterTextDivDivStart: {
      filterTextDivDivState = 0;
      break;
    }
    case cameraPositionNormalized > filterTextDivDivEnd: {
      filterTextDivDivState = 1;
      break;
    }
  }
  filterTextDivDiv.style.opacity = filterTextDivDivState;
  filterTextDivDiv.style.filter = `blur(${(1 - filterTextDivDivState) * 5}vh)`;
  filterButtonsActive = filterTextDivDivState === 1;
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
  if (!filterButtonsActive && !portfolioButtonActive && filterButtonHover && !dragging && !userLock)
    document.body.style.cursor = "default";
}

function scrollCameraBy(deltaY, duration) {
  const afterScroll = cameraWrapper.camera.position.y - deltaY;
  if (afterScroll >= 0) {
    gsap.to(cameraWrapper.camera.position, {y: 0, duration: duration, overwrite: "auto", onUpdate: scrollTrigger});
    gsap.to(cameraWrapper.centeredDiv, {y: 0, duration: duration, overwrite: "auto"});
  }
  else if (afterScroll <= -maxScroll) {
    gsap.to(cameraWrapper.camera.position, {y: -maxScroll, duration: duration, overwrite: "auto", onUpdate: scrollTrigger});
    gsap.to(cameraWrapper.centeredDiv, {y: -maxScroll * divPositionMultiplier * gsap.getProperty(cameraWrapper.centeredDiv, "scale"), duration: duration, overwrite: "auto"});
  }
  else {
    gsap.to(cameraWrapper.camera.position, {y: `-=${deltaY}`, duration: duration, overwrite: "auto", onUpdate: scrollTrigger});
    gsap.to(cameraWrapper.centeredDiv, {y: `-=${deltaY * divPositionMultiplier * gsap.getProperty(cameraWrapper.centeredDiv, "scale")}`, duration: duration, overwrite: "auto"});
  }
}

function scrollCameraTo(Y, duration) {
  gsap.to(cameraWrapper.camera.position, {y: Y, duration: duration, overwrite: "auto", onUpdate: scrollTrigger});
  gsap.to(cameraWrapper.centeredDiv, {y: Y * divPositionMultiplier, duration: duration, overwrite: "auto"});
}

function scrollMonitorBy(deltaY, duration) {
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
    monitorButton.material.color.set(0x000000);
    monitorPowered = false;
  }
  else {
    monitorCover.material.visible = false;
    monitorButton.material.color.set(0xff0000);
    monitorPowered = true;
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
      gsap.to(child.scale, {x: 0, y: 0, z: 0, duration: 0.2, override: "auto", onComplete: () => {
          iconGroupGroup.remove(child);
          spawnIcons();
        }
      });
    });
  }
  iconGroupGroup.rotation.x = iconRotation;
  scene.add(iconGroupGroup);
}

function spawnIcons() {
  const iconGroupSpawnerCurrentPosition = iconGroupSpawnerInitialPosition.clone();
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
        if (iconGroupSpawnerCurrentPosition.x <= iconGroupSpawnerInitialPosition.x - (iconGapHorizontal * 3)) {
          iconGroupSpawnerCurrentPosition.y -= iconGapVertical - 0.001;
          iconGroupSpawnerCurrentPosition.x = iconGroupSpawnerInitialPosition.x;
        }
        iconGroup.object.position.copy(iconGroupSpawnerCurrentPosition);
        iconGroup.originalPosition = iconGroup.object.position.clone();
        iconGroupSpawnerCurrentPosition.x -= iconGapHorizontal;
        iconGroupGroup.add(iconGroup.object);
        iconGroup.object.rotation.z = Math.PI / 4;
        gsap.to(iconGroup.object.rotation, {x: iconRotation, y: 0, z: 0, duration: 0.3, ease: "back", override: "auto"})
        gsap.to(iconGroup.object.scale, {x: iconScale, y: iconScale, z: 1, duration: 0.5, ease: "back(0.5)", override: "auto"});
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
    this.object = iconComponentGroup.clone(true);
    this.object.scale.set(iconScale, iconScale, 1);
    this.object.rotation.x = iconRotation;
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
    this.video.src = videoPath;
    this.video.loop = true;
    this.video.muted = true;
    this.video.playsInline = true;
    this.videoTexture = new THREE.VideoTexture(this.video);
    this.videoTexture.flipY = false;
    this.videoTexture.colorSpace = THREE.SRGBColorSpace;
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.wrapS = THREE.RepeatWrapping;
    this.videoTexture.wrapT = THREE.RepeatWrapping;
    this.videoTexture.generateMipmaps = false;
    this.iconScreen.material = new THREE.MeshBasicMaterial({map: this.videoTexture, opacity: 0.5, transparent: true, side: THREE.DoubleSide});
    this.video.addEventListener("loadedmetadata", () => {
      this.aspectRatio = this.video.videoWidth / this.video.videoHeight;
      this.screenTextureRepeatX = 1 / this.aspectRatio;
      this.screenTextureOffsetX = (1 - 1 / this.aspectRatio) / 2;
      this.iconScreen.material.map.repeat.set(this.screenTextureRepeatX, 1);
      this.iconScreen.material.map.offset.set(this.screenTextureOffsetX, 0);
      this.video.play();
    });

    //ICON GLOW
    const h2cGlowDiv = document.querySelector(".h2cGlowDiv");
    html2canvas(h2cGlowDiv, {scale: window.devicePixelRatio, backgroundColor: null, useCORS: true, width: h2cGlowDiv.offsetWidth, height: h2cGlowDiv.offsetHeight}).then((glowCanvas) => {

      const glowCompCanvas = document.createElement("canvas");
      glowCompCanvas.width = 1000;
      glowCompCanvas.height = 1000;

      glowCompCanvas.getContext("2d").translate(225, 225);
      glowCompCanvas.getContext("2d").filter = "blur(40px)";
      glowCompCanvas.getContext("2d").drawImage(glowCanvas, 0, 0);

      const texture = new THREE.CanvasTexture(glowCompCanvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
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
      html2canvas(h2cBackgroundDiv, {scale: window.devicePixelRatio, backgroundColor: null, useCORS: true, width: h2cBackgroundDiv.offsetWidth, height: h2cBackgroundDiv.offsetHeight}),
      html2canvas(h2cTextDiv, {scale: window.devicePixelRatio, backgroundColor: null, useCORS: true, width: h2cTextDiv.offsetWidth, height: h2cTextDiv.offsetHeight}),
      html2canvas(h2cForegroundDiv, {scale: window.devicePixelRatio, backgroundColor: null, useCORS: true, width: h2cForegroundDiv.offsetWidth, height: h2cForegroundDiv.offsetHeight}),
      html2canvas(h2cBorderDiv, {scale: window.devicePixelRatio, backgroundColor: null, useCORS: true, width: h2cBorderDiv.offsetWidth, height: h2cBorderDiv.offsetHeight})
    ]).then(([backgroundCanvas, textCanvas, foregroundCanvas, borderCanvas]) => {

      const textCompCanvas = document.createElement("canvas");
      textCompCanvas.width = 1000;
      textCompCanvas.height = 1000;

      textCompCanvas.getContext("2d").filter = "blur(3px)";
      textCompCanvas.getContext("2d").drawImage(textCanvas, 0, 0);
      textCompCanvas.getContext("2d").filter = "none";
      textCompCanvas.getContext("2d").drawImage(textCanvas, 0, 0);

      const backgroundCompCanvas = document.createElement("canvas");
      backgroundCompCanvas.width = 1000;
      backgroundCompCanvas.height = 1000;

      backgroundCompCanvas.getContext("2d").drawImage(backgroundCanvas, 0, 0);
      backgroundCompCanvas.getContext("2d").drawImage(textCompCanvas, 0, 0);

      const foregroundCompCanvas = document.createElement("canvas");
      foregroundCompCanvas.width = 1000;
      foregroundCompCanvas.height = 1000;

      foregroundCompCanvas.getContext("2d").filter = "blur(10px)";
      foregroundCompCanvas.getContext("2d").drawImage(foregroundCanvas, 0, 0);
      foregroundCompCanvas.getContext("2d").filter = "blur(1px)";
      foregroundCompCanvas.getContext("2d").drawImage(foregroundCanvas, 0, 0);

      const borderCompCanvas = document.createElement("canvas");
      borderCompCanvas.width = 1000;
      borderCompCanvas.height = 1000;

      borderCompCanvas.getContext("2d").filter = "blur(10px)";
      borderCompCanvas.getContext("2d").drawImage(borderCanvas, 0, 0);
      borderCompCanvas.getContext("2d").filter = "none";
      borderCompCanvas.getContext("2d").drawImage(borderCanvas, 0, 0);

      const finalCompCanvas = document.createElement("canvas");
      finalCompCanvas.width = 1000;
      finalCompCanvas.height = 1000;

      finalCompCanvas.getContext("2d").drawImage(foregroundCompCanvas, 0, 0);
      finalCompCanvas.getContext("2d").drawImage(backgroundCompCanvas, 0, 0);
      finalCompCanvas.getContext("2d").drawImage(borderCompCanvas, 0, 0);

      const texture2 = new THREE.CanvasTexture(finalCompCanvas);
      texture2.minFilter = THREE.LinearFilter;
      texture2.magFilter = THREE.LinearFilter;
      texture2.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture2.flipY = false;
      texture2.colorSpace = THREE.SRGBColorSpace;
      this.iconOverlay.material = new THREE.MeshBasicMaterial({map: texture2, transparent: true});
    });

    //ICON HOVER
    const h2cHoverDiv = document.querySelector(".h2cHoverDiv");
    html2canvas(h2cHoverDiv, {scale: window.devicePixelRatio, backgroundColor: null, useCORS: true, width: h2cHoverDiv.offsetWidth, height: h2cHoverDiv.offsetHeight}).then((hoverCanvas) => {
      const texture = new THREE.CanvasTexture(hoverCanvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      this.iconHover.material = new THREE.MeshBasicMaterial({map: texture, transparent: true, opacity: 0});
    });
  }
}

//ON LOAD
//region
gsap.set(cameraWrapper.centeredDiv, {xPercent: -50, yPercent: -50, y: 0});
resize();
//endregion

//VIDEO PLAYER
// region
let currentIndex = 0;
const player = document.querySelector(".VideoPlayer");
const playlist = ["https://PortfolioPullZone.b-cdn.net/Landing%20Page/Reel/Kinetic%20Rush.webm", "https://PortfolioPullZone.b-cdn.net/Landing%20Page/Reel/Chasms%20Call.webm"];
player.src = playlist[currentIndex];
player.play();
player.addEventListener("ended", () => {
  if (++currentIndex < playlist.length) {
    player.src = playlist[currentIndex];
    player.play();
  } else {
    currentIndex = 0;
    player.src = playlist[currentIndex];
    player.play();
  }
});
//endregion

//MONITOR GLOW LOOP
//region
const monitorGradientDiv = document.querySelector(".MonitorGlowDiv");
const obj = {value: 0};
gsap.to(obj, {value: 1, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut", onUpdate: () => {
    const alpha = obj.value;
    monitorGradientDiv.style.setProperty("--bg", `rgba(${mainColor.r}, ${mainColor.g}, ${mainColor.b}, ${alpha})`);
  }});
//endregion

//HOME SECTION HOVER
//region
const monitorDiv = document.querySelector(".MonitorDiv");
const videoPlayer = document.querySelector(".VideoPlayer");
monitorDiv.addEventListener("mouseenter", () => {
  monitorDivHover = true;
  gsap.to(videoPlayer, {opacity: 0.5, duration: 0.2, overwrite: "auto"});
});
monitorDiv.addEventListener("mouseleave", () => {
  monitorDivHover = false;
  gsap.to(videoPlayer, {opacity: 0.3, duration: 1, overwrite: "auto"});
});
//endregion

//SKILL HOVER
//region
const skillDiv = document.querySelector(".SkillDiv");
const skillText = document.querySelectorAll(".SkillText");
const skillIconImage = document.querySelectorAll(".SkillIconImage");
const skillTextIcon = document.querySelectorAll(".SkillTextIcon");

skillDiv.addEventListener("mouseenter", () => {
  skillText.forEach((child) => {
    gsap.to(child, {opacity: 1, duration: 0.2, overwrite: "auto"});
  });
  skillIconImage.forEach((child) => {
    gsap.to(child, {opacity: 0, duration: 0.2, overwrite: "auto"});
  });
  skillTextIcon.forEach((child) => {
    gsap.to(child, {opacity: 0, duration: 0.2, overwrite: "auto"});
  });
});
skillDiv.addEventListener("mouseleave", () => {
    skillText.forEach((child) => {
      gsap.to(child, {opacity: 0, duration: 0.2, overwrite: "auto"});
    });
    skillIconImage.forEach((child) => {
      gsap.to(child, {opacity: 1, duration: 0.2, overwrite: "auto"});
    });
    skillTextIcon.forEach((child) => {
      gsap.to(child, {opacity: 1, duration: 0.2, overwrite: "auto"});
    });
});
//endregion

//NAVIGATION BUTTONS
//region
const portfolioButtonDiv = document.querySelector(".PortfolioButtonDiv");
portfolioButtonDiv.addEventListener("click", () => {if (portfolioButtonActive && !userLock) scrollCameraTo(-0.45, 2)});

const homeSection = document.querySelector(".HomeSection");
const aboutSection = document.querySelector(".AboutSection");

const homeButtonDiv = document.querySelector(".HomeButtonDiv");
homeButtonDiv.addEventListener("click", () => {
  if (portfolioButtonActive && !userLock) {
    monitorActive = false;
    gsap.to(homeSection, {opacity: 1, duration: 0.5});
    gsap.to(aboutSection, {opacity: 0, duration: 0.5});
  }});

const aboutButtonDiv = document.querySelector(".AboutButtonDiv");
aboutButtonDiv.addEventListener("click", () => {
  if (portfolioButtonActive && !userLock) {
    monitorActive = true;
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
      gsap.to(button, {backgroundColor: "rgba(255, 255, 255, 0.1)", ease: "back", duration: 0.2, overwrite: "auto"});
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
      gsap.to(button, {backgroundColor: "rgba(255, 255, 255, 0.1)", ease: "back", duration: 0.2, overwrite: "auto"});
    }});
  button.addEventListener("mouseleave", () => {
    filterButtonHover = null;
    gsap.to(button, {backgroundColor: "rgba(255, 255, 255, 0.05)", duration: 0.2, overwrite: "auto"});
    if (filterButtonsActive && !dragging && !userLock) {
      document.body.style.cursor = "default";
    }
  });
});
//endregion