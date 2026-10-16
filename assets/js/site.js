/* Wisekey · site 16/10/2026. Movimento leve e rastreamento atrasado.
   Sem este arquivo a página funciona igual: só perde a entrada suave e a barra do celular. */
(function () {
  "use strict";
  var CFG = { GA4: "G-ZEM42H9RQX", PIXEL: "3574488776055615" }; // Pixel: confirmar no Gerenciador de Eventos
  var d = document, w = window;
  var reduce = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* entrada dos blocos e barras da curva */
  var els = [].slice.call(d.querySelectorAll(".rv, .bars"));
  if ("IntersectionObserver" in w && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else els.forEach(function (el) { el.classList.add("in"); });

  /* barra de progresso, menu da seção visível e CTA do celular */
  var bar = d.querySelector(".bar"), mcta = d.querySelector(".mcta"), hero = d.querySelector(".hero, .shero, .qhero");
  var links = [].slice.call(d.querySelectorAll(".top nav a[href^='#']"));
  var secs = links.map(function (a) { return d.querySelector(a.getAttribute("href")); });
  var tick = false;
  function frame() {
    tick = false;
    var y = w.scrollY, h = d.documentElement.scrollHeight - w.innerHeight;
    if (bar) bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")";
    if (mcta && hero) mcta.classList.toggle("on", y > hero.offsetHeight - 80);
    var cur = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < 120) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle("on", i === cur); });
  }
  w.addEventListener("scroll", function () { if (!tick) { tick = true; w.requestAnimationFrame(frame); } }, { passive: true });
  /* a primeira medição espera o load: medir a página antes disso força um layout longo no celular */
  if (d.readyState === "complete") w.requestAnimationFrame(frame);
  else w.addEventListener("load", function () { w.requestAnimationFrame(frame); });

  /* GA4 e Pixel só depois da primeira interação, para não pesar o carregamento */
  function ev(name, p) {
    if (w.gtag) w.gtag("event", name, p || {});
    if (w.fbq) w.fbq("trackCustom", name, p || {});
  }
  w.wkEvent = ev;
  function load() {
    if (load.done) return; load.done = true;
    if (CFG.GA4) {
      var s = d.createElement("script"); s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + CFG.GA4; d.head.appendChild(s);
      w.dataLayer = w.dataLayer || []; w.gtag = function () { w.dataLayer.push(arguments); };
      w.gtag("js", new Date()); w.gtag("config", CFG.GA4);
    }
    if (CFG.PIXEL) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(w, d, "script", "https://connect.facebook.net/en_US/fbevents.js");
      w.fbq("init", CFG.PIXEL); w.fbq("track", "PageView");
    }
  }
  ["scroll", "pointerdown", "keydown", "touchstart"].forEach(function (t) { w.addEventListener(t, load, { once: true, passive: true }); });
  w.addEventListener("load", function () { setTimeout(load, 6000); });

  d.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-ev]");
    if (a) ev(a.href && a.href.indexOf("wa.me") > -1 ? "clique_whatsapp" : "clique_cta", { local: a.getAttribute("data-ev") });
  });
})();
