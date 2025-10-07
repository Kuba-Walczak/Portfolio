import {gsap} from "gsap";

const btn = document.querySelector(".glass-btn");
const centeredDiv = document.querySelector(".AspectRatioLockDiv");
const DEFAULT_FONT_SIZE = 10;

window.addEventListener("resize", () => {
  resize();
});

function resize() {
  const targetAspect = 16 / 9;
  let newWidth, newHeight;
  if (window.innerWidth / window.innerHeight > targetAspect) {
    newHeight = window.innerHeight;
    newWidth = window.innerHeight * targetAspect;
  } else {
    newWidth = window.innerWidth;
    newHeight = window.innerWidth / targetAspect;
  }
  centeredDiv.style.width = `${newWidth}px`;
  centeredDiv.style.height = `${newHeight}px`;
  centeredDiv.style.fontSize = `${newWidth / DEFAULT_FONT_SIZE}px`;
}

btn.addEventListener("mouseenter", () => {
  gsap.to(btn, {duration: 0.6, y: -6, scale: 1.02, boxShadow:"0 0 10px rgba(255,255,255,0.9), inset 2px 2px 0 rgba(255,255,255,0.2)", overwrite: "auto"});
});

btn.addEventListener("mouseleave", () => {
  gsap.to(btn, {duration: 1, y: 0, scale: 1, boxShadow:"0 0 50px rgba(20,60,23,0.9), inset 2px 2px 0 rgba(255,255,255,0.2)", overwrite: "auto"});
});

btn.addEventListener("mousedown", (e) => {
  gsap.to(btn, {duration: 0.1, scale: 0.98, y: -2, overwrite: "auto"});
  const ripple = document.createElement("span");
  ripple.style.position = "absolute";
  ripple.style.width = ripple.style.height = "8px";
  ripple.style.top = (e.offsetY) + "px";
  ripple.style.left = (e.offsetX) + "px";
  ripple.style.background = "radial-gradient(circle, rgba(255,255,255,0), rgba(255,255,255,0.2))";
  ripple.style.borderRadius = "4px";
  ripple.style.pointerEvents = "none";
  btn.appendChild(ripple);
  gsap.to(ripple, {scale: 25, opacity: 0, duration: 0.5, onComplete: () => ripple.remove(), overwrite: "auto"});
});
btn.addEventListener('mouseup', () => {
  gsap.to(btn, {duration: 0.3, scale: 1, y: -6, overwrite: "auto"});
});

resize();