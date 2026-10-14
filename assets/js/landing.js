(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set) return set;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.querySelectorAll(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("mlr-theme", next); } catch (e) {}
    });
  });

  var reveals = document.querySelectorAll(".ticket, .year li, .ledger-list, .letter, .scope");
  if ("IntersectionObserver" in window && !reduceMotion) {
    reveals.forEach(function (el) { el.classList.add("reveal"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
  }

  /* Glance dashboard */
  var dash = document.querySelector(".dash");
  if (dash) {
    var ring = dash.querySelector(".ring-fg");
    var barEl = dash.querySelector(".bar i");
    var counters = dash.querySelectorAll(".count");
    var animateDash = function () {
      dash.classList.add("in");
      if (ring) ring.style.strokeDashoffset = 314 * (1 - parseFloat(ring.getAttribute("data-pct")) / 100);
      if (barEl) barEl.style.width = barEl.getAttribute("data-w") + "%";
      counters.forEach(function (el) {
        var target = parseInt(el.getAttribute("data-count"), 10);
        if (reduceMotion) { el.textContent = target; return; }
        var start = performance.now();
        (function frame(now) {
          var t = Math.min(1, (now - start) / 1300);
          el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
          if (t < 1) requestAnimationFrame(frame);
        })(start);
      });
    };
    if ("IntersectionObserver" in window && !reduceMotion) {
      counters.forEach(function (el) { el.textContent = "0"; });
      var dio = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { dio.disconnect(); animateDash(); }
      }, { threshold: 0.35 });
      dio.observe(dash);
    } else {
      animateDash();
    }
  }

  /* Who sees what */
  var scopes = {
    admin: ".node",
    director: ".n-mine",
    head: ".n-myschool",
    teacher: ".n-myclass"
  };
  var tree = document.querySelector(".tree");
  var tabs = document.querySelectorAll(".scope-tabs button");
  var texts = document.querySelectorAll(".st");
  function setRole(role) {
    tabs.forEach(function (t) { t.setAttribute("aria-selected", t.getAttribute("data-role") === role ? "true" : "false"); });
    texts.forEach(function (t) { t.classList.toggle("on", t.getAttribute("data-role") === role); });
    if (!tree) return;
    tree.querySelectorAll(".node").forEach(function (n) { n.classList.remove("lit"); });
    tree.querySelectorAll(scopes[role]).forEach(function (n) { n.classList.add("lit"); });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { setRole(t.getAttribute("data-role")); });
    t.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var dir = (e.key === "ArrowDown" || e.key === "ArrowRight") ? 1 : -1;
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus();
      setRole(next.getAttribute("data-role"));
    });
  });
  setRole("director");

  /* Report card */
  var report = document.querySelector(".report");
  if (!report) return;
  var steps = report.querySelectorAll(".rp-steps li");
  var stateEl = report.querySelector(".rp-state");
  var stamp = report.querySelector(".stamp");
  var stampText = stamp.querySelector("span");
  var headSig = report.querySelector(".sig-head");
  var totals = report.querySelectorAll(".c-total");
  var grades = report.querySelectorAll(".c-grade");
  var positions = report.querySelectorAll(".c-pos");
  var names = ["Open", "Collating", "Submitted", "Approved", "Locked"];

  function fill(cells, on) {
    cells.forEach(function (c) {
      var v = on ? c.getAttribute("data-v") : "–";
      if (c.textContent !== v) { c.textContent = v; if (on) { c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); } }
    });
  }
  function show(s) {
    stateEl.textContent = names[s];
    steps.forEach(function (li, k) { li.classList.toggle("done", k <= s); li.classList.toggle("now", k === s); });
    fill(totals, s >= 1);
    fill(grades, s >= 2);
    fill(positions, s >= 2);
    headSig.textContent = s >= 3 ? "— approved" : "—";
    stamp.classList.toggle("on", s >= 3);
    stamp.classList.toggle("locked", s >= 4);
    stampText.textContent = s >= 4 ? "Locked" : "Approved";
  }

  if (reduceMotion) { show(4); return; }
  var visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(report);
  }
  show(0);
  (async function loop() {
    var s = 0;
    for (;;) {
      await sleep(s === 4 ? 4200 : 1700);
      if (!visible || document.hidden) continue;
      s = (s + 1) % 5;
      show(s);
    }
  })();
})();
