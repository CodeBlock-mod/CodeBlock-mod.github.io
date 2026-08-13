// CodeBlock Mod — landing page interactions (vanilla, no deps)
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- syntax highlighter (DSL subset) ----
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function highlight(src) {
    return src.split("\n").map(function (line) {
      if (/^\s*#/.test(line)) return '<span class="c-com">' + escapeHtml(line) + "</span>";
      var h = escapeHtml(line);
      h = h.replace(/\b(if|else|for|int)\b/g, '<span class="c-kw">$1</span>');
      h = h.replace(/\b(cin|cout)\b/g, '<span class="c-fn">$1</span>');
      h = h.replace(/\b(\d+)\b/g, '<span class="c-num">$1</span>');
      return h;
    }).join("\n");
  }

  // ---- hero typewriter ----
  var heroCode = document.getElementById("hero-code");
  var heroSrc = "# 把北面(通道2)的输入\n# 原样从顶面(通道1)输出\ncout(1, cin(2));";
  if (heroCode) {
    if (reduceMotion) {
      heroCode.innerHTML = highlight(heroSrc);
    } else {
      var i = 0;
      (function tick() {
        if (i <= heroSrc.length) {
          heroCode.textContent = heroSrc.slice(0, i);
          i++;
          setTimeout(tick, 34);
        } else {
          heroCode.innerHTML = highlight(heroSrc);
        }
      })();
    }
  }

  // ---- code showcase tabs ----
  var examples = {
    passthrough: {
      code: "# 信号透传：北面(通道2)输入 -> 顶面(通道1)输出\ncout(1, cin(2));",
      note: "最基础的用法：把某个面的输入原样从另一个面输出。"
    },
    threshold: {
      code: "# 阈值比较器：北面信号 > 8 时顶面输出满信号 15\nif (cin(2) > 8) {\n  cout(1, 15);\n} else {\n  cout(1, 0);\n}",
      note: "分支结构：强度超过 8 输出满信号，否则归零。"
    },
    adder: {
      code: "# 加法器雏形：顶面 = 北(通道2) + 南(通道3)\ncout(1, cin(2) + cin(3));",
      note: "运算：两路输入相加，输出自动限幅到 0–15。"
    },
    counter: {
      code: "# 计数器(需外接反馈)：本面输出 +1\n# 用红石把该输出面连回它自己的输入面\ncout(0, cin(0) + 1);",
      note: "把某输出面的红石连回它自己的输入面，每 tick 累加，到 15 回绕。"
    }
  };
  var showcaseCode = document.getElementById("showcase-code");
  var showcaseNote = document.getElementById("showcase-note");
  var tabs = document.querySelectorAll(".tab");

  function renderExample(key) {
    var ex = examples[key];
    if (!ex || !showcaseCode) return;
    showcaseCode.innerHTML = highlight(ex.code);
    if (showcaseNote) showcaseNote.textContent = ex.note;
  }
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      renderExample(tab.dataset.ex);
    });
  });
  renderExample("passthrough");

  // ---- nav stuck state ----
  var nav = document.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("is-stuck", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- reveal on scroll ----
  var revealables = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, idx) {
        if (entry.isIntersecting) {
          var el = entry.target;
          // gentle stagger for siblings entering together
          setTimeout(function () { el.classList.add("is-in"); }, (idx % 4) * 70);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealables.forEach(function (el) { io.observe(el); });
  }
})();
