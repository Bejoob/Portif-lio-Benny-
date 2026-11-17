/*
 * Rastreamento das paginas da Benny Solucoes Web (exceto comece.html, que tem configuracao propria).
 * - Carrega a Google tag (GA4 + Google Ads) para que o clique do anuncio (gclid) fique salvo no cookie.
 * - Conta como conversao do Google Ads ("Contato") todo clique em link de WhatsApp.
 * - Mantem a origem "anuncio" ao seguir para o diagnostico e na mensagem do WhatsApp.
 */
(function () {
  "use strict";

  var GA_ID = "G-2LT4B3DK7B";
  var ADS_ID = "AW-18516964374";
  var ADS_SEND_TO = "AW-18516964374/YWnECM2g2aMdEJboyf1E";
  var TEXTO_ANUNCIO = "Vim pelo anúncio.";

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function () { window.dataLayer.push(arguments); };
    var tag = document.createElement("script");
    tag.async = true;
    tag.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(tag);
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
    window.gtag("config", ADS_ID);
  }

  var origem = "";
  try {
    origem = (new URLSearchParams(window.location.search).get("o") || "").toLowerCase();
  } catch (erro) {}

  function prepararLinks() {
    if (!origem) return;

    Array.prototype.forEach.call(document.querySelectorAll('a[href*="comece.html"]'), function (link) {
      try {
        var url = new URL(link.getAttribute("href"), window.location.href);
        url.searchParams.set("o", origem);
        link.setAttribute("href", url.pathname + url.search + url.hash);
      } catch (erro) {}
    });

    if (origem !== "anuncio") return;
    Array.prototype.forEach.call(document.querySelectorAll('a[href*="wa.me/"]'), function (link) {
      try {
        var url = new URL(link.href);
        var texto = url.searchParams.get("text") || "";
        if (texto.indexOf(TEXTO_ANUNCIO) === -1) {
          url.searchParams.set("text", (texto ? texto + " " : "") + TEXTO_ANUNCIO);
          link.href = url.toString();
        }
      } catch (erro) {}
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", prepararLinks);
  } else {
    prepararLinks();
  }

  document.addEventListener("click", function (evento) {
    var alvo = evento.target;
    var link = alvo && alvo.closest ? alvo.closest('a[href*="wa.me/"], a[href*="api.whatsapp.com/"]') : null;
    if (!link) return;

    var destino = link.href;
    var novaAba = link.target === "_blank" || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.button === 1;
    var seguiu = false;
    function seguir() {
      if (seguiu) return;
      seguiu = true;
      if (!novaAba) window.location.href = destino;
    }

    try {
      window.gtag("event", "whatsapp_click", { link_url: destino, pagina: window.location.pathname, origem: origem || "site" });
      window.gtag("event", "conversion", { send_to: ADS_SEND_TO, event_callback: seguir, event_timeout: 1500 });
    } catch (erro) {
      return;
    }

    // Link na mesma aba: espera o envio da conversao antes de sair da pagina (ou 1,5 s, se a tag estiver bloqueada).
    if (!novaAba) {
      evento.preventDefault();
      window.setTimeout(seguir, 1500);
    }
  }, true);
})();
