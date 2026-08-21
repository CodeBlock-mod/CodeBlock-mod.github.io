// CodeBlock Mod — download experience driven by versions.json
// 下载面板 / 进度点 / 版本徽标 / 历史版本 全部由根目录 versions.json 渲染，
// 以后发版只需改 versions.json + 往 assets/downloads/vX/ 放新 jar，无需动 HTML。
(function () {
  "use strict";

  var stage = document.getElementById("dl3d");
  if (!stage) return;

  var canvas = document.getElementById("dl-canvas");
  var panels = [];
  var dots = [];
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
    if (cube && targetColor && colors) {
      spinTarget += Math.PI * 0.6;
      targetColor.copy(colors[i % colors.length]);
    }
  }

  function onScroll() {
    if (!panels.length) return;
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

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function buildPanels(data) {
    var panelsEl = document.getElementById("dl-panels");
    var progEl = document.getElementById("dl-progress");
    if (!panelsEl || !progEl) return null;

    panelsEl.innerHTML = "";
    progEl.innerHTML = "";

    var versions = data.versions || [];
    var ver = versions.filter(function (v) { return v.id === data.current; })[0] || versions[0];

    var items = [{
      tag: "镜像 · Gitee",
      title: "Gitee 镜像仓库",
      desc: "国内可直连的镜像仓库，编译好的 jar 都在 downloads/ 目录。GitHub 账号暂时被封，Gitee 是当前主下载源。",
      href: data.gitee || "#",
      file: false
    }];

    if (ver && ver.files) {
      ver.files.forEach(function (f) {
        items.push({
          tag: f.tag || ("官网直链 · " + f.label),
          title: f.label,
          desc: f.desc || "",
          href: f.path,
          file: true
        });
      });
    }

    items.forEach(function (it, idx) {
      var a = el("a", "btn btn--primary");
      a.href = it.href;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = it.file ? "前往下载" : "前往仓库下载";

      var art = el("article", "dl-panel" + (idx === 0 ? " is-active" : ""));
      art.setAttribute("data-i", idx);
      art.appendChild(el("span", "dl-panel__tag", it.tag));
      art.appendChild(el("h3", null, it.title));
      art.appendChild(el("p", null, it.desc));
      art.appendChild(a);
      panelsEl.appendChild(art);

      progEl.appendChild(el("span", "dot" + (idx === 0 ? " is-active" : "")));
    });

    panels = Array.prototype.slice.call(panelsEl.querySelectorAll(".dl-panel"));
    dots = Array.prototype.slice.call(progEl.querySelectorAll(".dot"));
    return ver;
  }

  function buildHistory(data) {
    var sel = document.getElementById("version-select");
    var wrap = document.getElementById("version-files");
    if (!sel || !wrap) return;

    sel.innerHTML = "";
    (data.versions || []).forEach(function (v) {
      var o = el("option", null, v.name + (v.id === data.current ? "（当前）" : ""));
      o.value = v.id;
      sel.appendChild(o);
    });

    function show(id) {
      var v = (data.versions || []).filter(function (x) { return x.id === id; })[0];
      if (!v) return;
      wrap.innerHTML = "";
      var head = el("p", "version-files__head");
      head.innerHTML = "<strong>" + v.name + "</strong> · " + (v.date || "") +
        (v.note ? " — " + v.note : "");
      wrap.appendChild(head);

      (v.files || []).forEach(function (f) {
        var row = el("div", "version-file");
        row.appendChild(el("span", null, f.label));
        var a = el("a", "btn btn--ghost", "下载");
        a.href = f.path;
        a.target = "_blank";
        a.rel = "noopener";
        row.appendChild(a);
        wrap.appendChild(row);
      });
    }

    sel.addEventListener("change", function () { show(sel.value); });
    show(data.current);
  }

  function applyCompanion(data, ver) {
    var direct = document.getElementById("ecj-direct");
    var gitee = document.getElementById("ecj-gitee");
    if (gitee) gitee.href = data.gitee || gitee.href;
    if (direct && ver && ver.files) {
      var ecj = ver.files.filter(function (f) { return /ecj/i.test(f.label); })[0];
      if (ecj) direct.href = ecj.path;
    }
  }

  function start() {
    if (hasWebGL && initThree()) {
      stage.classList.add("is-3d");
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  function fallbackGitee(data) {
    // JSON 加载失败时至少保留一个 Gitee 面板，避免下载区空白
    var panelsEl = document.getElementById("dl-panels");
    var progEl = document.getElementById("dl-progress");
    if (!panelsEl || !progEl) return;
    panelsEl.innerHTML = "";
    progEl.innerHTML = "";
    var a = el("a", "btn btn--primary");
    a.href = (data && data.gitee) || "https://gitee.com/immediate-success-upon-arrival/CodeBlock-mod-release";
    a.target = "_blank"; a.rel = "noopener"; a.textContent = "前往仓库下载";
    var art = el("article", "dl-panel is-active");
    art.setAttribute("data-i", "0");
    art.appendChild(el("span", "dl-panel__tag", "镜像 · Gitee"));
    art.appendChild(el("h3", null, "Gitee 镜像仓库"));
    art.appendChild(el("p", null, "国内可直连的镜像仓库，编译好的 jar 都在 downloads/ 目录。"));
    art.appendChild(a);
    panelsEl.appendChild(art);
    progEl.appendChild(el("span", "dot is-active"));
    panels = Array.prototype.slice.call(panelsEl.querySelectorAll(".dl-panel"));
    dots = Array.prototype.slice.call(progEl.querySelectorAll(".dot"));
  }

  fetch("/api/versions", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      var ver = buildPanels(data);
      buildHistory(data);
      applyCompanion(data, ver);
      var cv = document.getElementById("current-version");
      if (cv && ver) cv.textContent = "当前版本：" + ver.name + "（" + (ver.date || "") + "）";
      start();
    })
    .catch(function (err) {
      console.error("versions.json 加载失败，使用 Gitee 兜底面板：", err);
      try {
        var cached = { gitee: "https://gitee.com/immediate-success-upon-arrival/CodeBlock-mod-release" };
        fallbackGitee(cached);
        start();
      } catch (e) { /* 忽略 */ }
    });
})();
