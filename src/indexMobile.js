import {gsap} from "gsap";

//CONSTANTS
const MAIN_COLOR = {
  r: 67,
  g: 59,
  b: 255
}
const MAGIC_DIV_OFFSET = 0.96;
const DEFAULT_FONT_SIZE = 10;

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight
};
const cameraWrapper = {
  centeredDiv: document.querySelector(".CenteredDiv"),
  scrollDiv: document.querySelector(".ScrollDiv"),
  faceForegroundImage: document.querySelector(".FaceForegroundImage")
};


const iconArray = [
  //new Icon(projectType.PROGRAMMING, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/KineticRush4.webm", "Kinetic Rush", "A running-themed community challenge", ["blender", "css", "photoshop"]),
  //new Icon(projectType.TECHNICAL_ART, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/ChasmsCall4.webm", "Project 2", "Description 2", ["blender", "js"]),
  //new Icon(projectType.ART, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/ChasmsCall4.webm", "Project 3", "Description 3", ["aftereffects"]),
  //new Icon(projectType.PROGRAMMING, "https://PortfolioPullZone.b-cdn.net/LandingPage/Icons/ChasmsCall4.webm", "Project 4", "Description 4", ["css"])
];

//UTILITY
//region

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

let monitorDivHover = false;
let monitorActive = false;
let scrollingDiscovered = false;
let scrollShowInterval = null;

let finishedLoading = false;
//endregion

window.addEventListener("wheel", (event) => {
  if (monitorDivHover && monitorActive) {
    scrollMonitorBy(event.deltaY * 0.2, 0.5, true)
  }
});

window.addEventListener("touchstart", (event) => {
  if (event.touches.length === 1 && event.target.matches(".ScrollDiv"))
    monitorDivHover = true;
});

window.addEventListener("touchmove", (event) => {
  if (monitorDivHover && monitorActive) {
    scrollMonitorBy(event.deltaY * 0.2, 0.5, true)
  }
});


window.addEventListener("resize", () => {
  resize();
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
  zoomCameraTo(-0.35, 2)
  //setTimeout(() => window.open("project 1.html", "_self"), 2000);
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

//ON LOAD
//region
const videoPlayer = document.querySelector(".VideoPlayer");
const playlist = ["https://PortfolioPullZone.b-cdn.net/LandingPage/Reel/KineticRush2.webm", "https://PortfolioPullZone.b-cdn.net/LandingPage/Reel/ChasmsCall2.webm"];

document.querySelector(".testing2").addEventListener("click", () => {
  finishedLoading = true;
  document.querySelector(".BackgroundVideo").src = "https://PortfolioPullZone.b-cdn.net/LandingPage/Background.webm";
  document.querySelector(".BackgroundVideo").play();
  videoPlayer.src = playlist[0];
  videoPlayer.play();
  iconArray.forEach((child) => {child.video.play()});
  document.documentElement.requestFullscreen();
});

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
document.querySelector(".MonitorDiv").addEventListener("mouseenter", () => {monitorDivHover = true});
document.querySelector(".MonitorDiv").addEventListener("mouseleave", () => {monitorDivHover = false});
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
portfolioButtonDiv.addEventListener("click", () => {
  gsap.set(portfolioButtonDiv, {backgroundColor: "rgba(255, 255, 255, 0.15)", overwrite: "auto"});
  gsap.to(portfolioButtonDiv, {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.5, overwrite: "auto"});
});

document.querySelector(".HomeButtonDiv").addEventListener("click", () => {
  gsap.set(".HomeButtonDiv", {backgroundColor: "rgba(255, 255, 255, 0.15)", overwrite: "auto"});
  gsap.to(".HomeButtonDiv", {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.5, overwrite: "auto"});
  monitorState(false);
  gsap.to(".HomeSection", {opacity: 1, duration: 0.5});
  gsap.to(".AboutSection", {opacity: 0, duration: 0.5});
  });

const aboutButtonDiv = document.querySelector(".AboutButtonDiv");
aboutButtonDiv.addEventListener("click", () => {
  gsap.set(".AboutButtonDiv", {backgroundColor: "rgba(255, 255, 255, 0.15)", overwrite: "auto"});
  gsap.to(".AboutButtonDiv", {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.5, overwrite: "auto"});
  monitorState(true);
  gsap.to(".AboutSection", {opacity: 1, duration: 0.5});
  gsap.to(".HomeSection", {opacity: 0, duration: 0.5});
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
  }
});

[document.querySelector(".HomeButtonDiv"), portfolioButtonDiv, aboutButtonDiv, filter1ButtonDiv, filter2ButtonDiv, filter3ButtonDiv].forEach(button => {
  button.addEventListener("mouseenter", () => {
    document.body.style.cursor = "pointer";
    gsap.to(button, {backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.2, overwrite: "auto"});});
  button.addEventListener("mouseleave", () => {
    document.body.style.cursor = "default";
    gsap.to(button, { backgroundColor: "rgba(255, 255, 255, 0.05)", duration: 0.2, overwrite: "auto"});
  });
});
//endregion