// CodeBlock Mod — Three.js scroll-driven download experience
// Wheel scroll => page scrolls => active download mirror steps forward,
// the code-block cube eases a flip + recolors per mirror.
(function () {
  "use strict";

  var stage = document.getElementById("dl3d");
  if (!stage) return;

  var canvas = document.getElementById("dl-canvas");
  var panels = Array.prototype.slice.call(stage.querySelectorAll(".dl-panel"));
  var dots = Array.prototype.slice.call(document.querySelectorAll("#dl-progress .dot"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var hasWebGL = (function () {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  })();

  var current = 0;
  var spinTarget = 0;
  var cube = null, renderer = null, scene = null, camera = null, mat = null;
  var targetColor = null;
  var colors = null;

  function setIndex(i) {
    if (i === current) return;
    current = i;
    panels.forEach(function (p, idx) { p.classList.toggle("is-active", idx === i); });
    dots.forEach(function (d, idx) { d.classList.toggle("is-active", idx === i); });
    if (cube && targetColor) {
      spinTarget += Math.PI * 0.6;          // little flip on change
      targetColor.copy(colors[i] || colors[0]);
    }
  }

  function onScroll() {
    var rect = stage.getBoundingClientRect();
    var total = stage.offsetHeight - window.innerHeight;
    var scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
    var p = total > 0 ? scrolled / total : 0;
    var idx = Math.floor(p * panels.length);
    if (idx > panels.length - 1) idx = panels.length - 1;
    if (idx < 0) idx = 0;
    setIndex(idx);
  }

  function resize() {
    if (!renderer) return;
    var w = canvas.clientWidth || stage.clientWidth || 640;
    var h = canvas.clientHeight || stage.clientHeight || 640;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!cube) return;
    if (!reduce) {
      cube.rotation.y += 0.0035;
      cube.rotation.x += 0.0012;
    }
    if (spinTarget !== 0) {
      cube.rotation.y += spinTarget * 0.08;
      spinTarget *= 0.9;
      if (Math.abs(spinTarget) < 0.001) spinTarget = 0;
    }
    if (mat && targetColor) mat.color.lerp(targetColor, 0.06);
    renderer.render(scene, camera);
  }

  function initThree() {
    if (typeof THREE === "undefined") return false;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) { return false; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4.4);
    var geo = new THREE.BoxGeometry(2, 2, 2);
    var tex = new THREE.TextureLoader().load("assets/images/code_block.png");
    mat = new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff, transparent: true });
    targetColor = new THREE.Color(0xffffff);
    colors = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x6ea8ff),
      new THREE.Color(0x7ee0a8),
      new THREE.Color(0xffb86b)
    ];
    cube = new THREE.Mesh(geo, mat);
    scene.add(cube);
    resize();
    window.addEventListener("resize", resize);
    animate();
    return true;
  }

  if (hasWebGL && initThree()) {
    stage.classList.add("is-3d");
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
  // If WebGL/THREE unavailable, CSS leaves the panels as a plain grid (fallback).
})();
