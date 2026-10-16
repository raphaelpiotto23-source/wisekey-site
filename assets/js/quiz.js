/* Wisekey · quiz do diagnóstico (16/10/2026). Regras em 08_Marketing/quiz-perfil-wisekey.md.
   Porta de entrada + 5 perguntas, nome e WhatsApp antes do resultado, perfil com encaixe em %.
   O lead vai para LEAD_URL (Apps Script → Pipedrive) quando estiver preenchido; até lá, só WhatsApp. */
(function () {
  "use strict";
  var LEAD_URL = ""; // URL do Apps Script publicado (docs/2026-10-15_wisekey_pipedrive_whatsapp.md da v5)
  var WA = "5511917952603";
  var d = document, box = d.getElementById("quiz");
  if (!box) return;
  var $ = function (s, r) { return (r || box).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || box).querySelectorAll(s)); };
  var ev = function (n, p) { if (window.wkEvent) window.wkEvent(n, p); };

  var PERFIS = {
    F: { nome: "Studio Campus", h: "Patrimônio que começa pela família.",
      why: "Seu filho mora no imóvel durante o curso. O dinheiro que iria para o aluguel vira parcela de um ativo seu. Quando ele se forma, o studio vira renda.",
      b: "Vila Mariana, Higienópolis, Consolação, Butantã, Liberdade",
      i: "Studio ou 1 dormitório, perto do metrô e a poucos minutos a pé da faculdade.",
      a: "A conta que importa: parcela de hoje contra o aluguel que você já pagaria. E quem vai alugar depois da formatura." },
    R: { nome: "Renda Previsível", h: "Aluguel que cai todo mês, sem você operar nada.",
      why: "Locação de longo prazo perto de polo corporativo e metrô. Contrato longo, alguém cuidando, você só acompanha o extrato.",
      b: "Pinheiros, Vila Mariana, Paraíso, Bela Vista, Brooklin",
      i: "Studio ou 1 dormitório compacto, com liquidez alta de revenda.",
      a: "Rende menos que o Airbnb no mês bom. Em compensação, não tem mês fraco. Compare sempre com o CDI líquido." },
    A: { nome: "Operador de Temporada", h: "Mais renda por metro quadrado, com gestão profissional.",
      why: "Studio em região de negócios, saúde e eventos, operado por co-host no padrão Superhost. A diária paga mais que o aluguel fixo na média do ano.",
      b: "Campo Belo, Santo Amaro, Alto da Boa Vista, Brooklin, Vila Mariana",
      i: "Studio em prédio com uso para temporada liberado por escrito, perto do metrô.",
      a: "Todo mês bom tem um mês fraco. O cenário certo considera ocupação baixa, taxa do co-host e condomínio." },
    P: { nome: "Começar com Pouco", h: "Entrada diluída na obra, valorização até as chaves.",
      why: "Compra na planta ou em lançamento. Você parcela a entrada durante a obra e pega a valorização entre o lançamento e a entrega.",
      b: "Barra Funda, Butantã, Vila Sônia, Ipiranga, Tatuapé",
      i: "Studio ou 1 dormitório em lançamento, perto de eixo de metrô.",
      a: "O capital fica sem gerar renda até a entrega. Incorporadora e prazo de obra decidem o resultado." }
  };
  var ORDEM = ["F", "R", "A", "P"];
  var FLUXO = ["porta", "1", "2", "3", "4", "5", "lead", "res"];
  var st = { i: 0, porta: "", resp: {}, txt: {} };

  function show(i) {
    st.i = i;
    $$(".step").forEach(function (s) { s.classList.toggle("on", s.getAttribute("data-step") === FLUXO[i]); });
    var p = Math.round(Math.min(i, 6) / 6 * 100);
    $(".qbar i").style.setProperty("--p", p + "%");
    $(".qback").hidden = i === 0 || i === 7;
    var f = FLUXO[i];
    $(".qcount").textContent = f === "porta" ? "Seu cenário" : f === "lead" ? "Quase lá" : f === "res" ? "Resultado" : "Pergunta " + f + " de 5";
    var top = box.getBoundingClientRect().top;
    if (i > 0 && (top < 0 || top > window.innerHeight * 0.5)) box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function placar() {
    var s = { F: 0, R: 0, A: 0, P: 0 };
    if (st.porta) s[st.porta] += 4;
    Object.keys(st.resp).forEach(function (k) {
      st.resp[k].split(" ").forEach(function (t) { s[t[0]] += +t.slice(1); });
    });
    var win = ORDEM.slice().sort(function (a, b) {
      return s[b] - s[a] || (a === st.porta ? -1 : b === st.porta ? 1 : ORDEM.indexOf(a) - ORDEM.indexOf(b));
    })[0];
    return { s: s, win: win };
  }

  $$(".opt").forEach(function (b) {
    b.addEventListener("click", function () {
      var step = b.closest(".step").getAttribute("data-step");
      $$(".opt", b.parentNode).forEach(function (o) { o.classList.remove("sel"); });
      b.classList.add("sel");
      if (step === "porta") { st.porta = b.getAttribute("data-v"); ev("quiz_inicio", { porta: st.porta }); }
      else { st.resp[step] = b.getAttribute("data-s"); st.txt[step] = b.getAttribute("data-t"); ev("quiz_pergunta", { n: step }); }
      setTimeout(function () { show(st.i + 1); }, 180);
    });
  });
  $(".qback").addEventListener("click", function () { if (st.i > 0) show(st.i - 1); });

  /* captura */
  var form = $(".form"), tel = form.whatsapp;
  var digits = function (v) { return (v || "").replace(/\D/g, ""); };
  tel.addEventListener("input", function () {
    var x = digits(tel.value).slice(0, 11), o = x;
    if (x.length > 2) o = "(" + x.slice(0, 2) + ") " + x.slice(2);
    if (x.length > 7) o = "(" + x.slice(0, 2) + ") " + x.slice(2, 7) + "-" + x.slice(7);
    tel.value = o;
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var nome = form.nome.value.trim(), w = digits(tel.value), err = $(".err", form);
    if (form.site.value) return;
    if (nome.length < 2) { err.textContent = "Escreva o seu nome."; form.nome.focus(); return; }
    if (w.length < 10) { err.textContent = "Confira o WhatsApp com DDD."; tel.focus(); return; }
    err.textContent = "";
    var r = placar(), P = PERFIS[r.win], ref = "WK" + Date.now().toString(36).toUpperCase().slice(-6);
    var lead = { tipo: "diagnostico", ref: ref, nome: nome, whatsapp: w, cidade: form.cidade.value.trim(),
      perfil: P.nome, porta: st.porta, respostas: st.txt, pontos: r.s, pagina: location.pathname + location.search, quando: new Date().toISOString() };
    ev("lead", { perfil: P.nome });
    if (LEAD_URL) {
      var body = JSON.stringify(lead);
      if (!(navigator.sendBeacon && navigator.sendBeacon(LEAD_URL, new Blob([body], { type: "text/plain" }))))
        fetch(LEAD_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: body }).catch(function () {});
    }
    render(r, P, lead);
    show(7);
  });

  function render(r, P, lead) {
    $(".rh").textContent = P.nome + ". " + P.h;
    $(".why").textContent = P.why;
    $(".rb").textContent = P.b;
    $(".ri").textContent = P.i;
    $(".ra").textContent = P.a;
    var tot = ORDEM.reduce(function (a, k) { return a + r.s[k]; }, 0) || 1;
    $(".fit").innerHTML = ORDEM.map(function (k) {
      var pc = Math.round(r.s[k] / tot * 100);
      return '<div class="' + (k === r.win ? "top" : "") + '"><span>' + PERFIS[k].nome + '</span><span class="b"><i style="width:' + pc + '%"></i></span><span>' + pc + "%</span></div>";
    }).join("");
    var t = "Oi, sou " + lead.nome + (lead.cidade ? ", de " + lead.cidade : "") + ". Fiz o diagnóstico da Wisekey e deu " + P.nome +
      ". Entrada: " + (lead.respostas["1"] || "") + ". Pagamento: " + (lead.respostas["5"] || "") + ". Quero agendar a conversa. Ref " + lead.ref + ".";
    $(".rwa").href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(t);
  }

  $(".again").addEventListener("click", function () {
    st = { i: 0, porta: "", resp: {}, txt: {} };
    $$(".opt").forEach(function (o) { o.classList.remove("sel"); });
    show(0);
  });
})();
