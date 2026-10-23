/* Google Ads — conversão por clique nos CTAs de contato.
   A tag (gtag.js) é carregada estática no <head> de cada página, porque o
   rastreador do Google Ads precisa enxergá-la no HTML. Aqui ficam só os
   rótulos e um listener delegado que cobre o site inteiro: nenhum botão
   precisa ser editado, inclusive os que o JavaScript cria depois. */
(function () {
  "use strict";

  var AW_ID = "AW-18516964374";
  var CONVERSAO_CONTATO = "YWnECM2g2aMdEJboyf1E";

  function rotuloDe(href) {
    if (href.indexOf("https://wa.me/") === 0) return CONVERSAO_CONTATO;
    if (href.indexOf("https://api.whatsapp.com/") === 0) return CONVERSAO_CONTATO;
    if (href.indexOf("tel:") === 0) return CONVERSAO_CONTATO;
    return null;
  }

  document.addEventListener("click", function (e) {
    var alvo = e.target;
    if (!alvo || typeof alvo.closest !== "function") return;
    var link = alvo.closest("a[href]");
    if (!link || typeof window.gtag !== "function") return;

    var rotulo = rotuloDe(link.getAttribute("href") || "");
    if (!rotulo) return;

    window.gtag("event", "conversion", { send_to: AW_ID + "/" + rotulo });
  }, true);
})();
