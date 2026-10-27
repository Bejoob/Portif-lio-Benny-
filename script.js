(() => {
  const body = document.body;
  const root = document.documentElement;
  const params = new URLSearchParams(window.location.search);
  const forceMotion = params.get('motion') === '1';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !forceMotion;
  if (forceMotion) document.documentElement.classList.add('force-motion');

  // Se a CDN do GSAP cair, `html.js` sai e todo estado escondido volta a aparecer
  // (o CSS so esconde sob `html.js`). `?nogsap=1` simula essa queda para teste.
  const hasGsap = !params.has('nogsap')
    && typeof window.gsap !== 'undefined'
    && typeof window.ScrollTrigger !== 'undefined';

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  else root.classList.remove('js');

  // Unico portao para todo codigo novo de animacao.
  const animate = hasGsap && !reducedMotion;
  const loader = document.querySelector('.loader');
  const loaderCounter = document.querySelector('.loader__counter span');
  const loaderLine = document.querySelector('.loader__line span');

  body.classList.add('is-loading');

  let loaderDone = false;

  const finishLoading = () => {
    if (loaderDone) return;          // idempotente: rAF e failsafe podem chamar juntos
    loaderDone = true;
    clearTimeout(loaderFailsafe);
    loaderCounter.textContent = '100';
    loaderLine.style.width = '100%';
    loader.classList.add('is-hidden');
    body.classList.remove('is-loading');
    body.classList.add('is-ready');
    onLoaderDone();
  };

  const LOADER_DURACAO = 3000;   // contagem de 00 a 100
  const LOADER_PAUSA = 400;      // respiro no 100% antes de sair

  // O rAF pode nunca completar (aba em segundo plano, painel sem compor frames).
  // Sem este prazo a pagina fica presa no preloader com overflow travado.
  // Tem de ser folgado em relacao a duracao, senao corta o proprio loader.
  const loaderFailsafe = setTimeout(finishLoading, LOADER_DURACAO + LOADER_PAUSA + 3500);

  if (reducedMotion) {
    finishLoading();
  } else {
    const start = performance.now();
    const tick = (now) => {
      const elapsed = Math.min((now - start) / LOADER_DURACAO, 1);
      // Expoente 1.5 em vez de 3: com o cubico o contador chegava a 88% em 0,7s
      // e rastejava o resto — dava sensacao de carregamento instantaneo.
      const eased = 1 - Math.pow(1 - elapsed, 1.5);
      const progress = Math.round(eased * 100);
      loaderCounter.textContent = String(progress).padStart(2, '0');
      loaderLine.style.width = `${progress}%`;
      if (elapsed < 1) requestAnimationFrame(tick);
      else setTimeout(finishLoading, LOADER_PAUSA);
    };
    requestAnimationFrame(tick);
  }

  // Envolve cada caractere visivel em <span class="char">, preservando espacos
  // como texto (para o navegador ainda poder quebrar linha).
  const splitChars = (el) => {
    const chars = [];
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...child.textContent].forEach((ch) => {
            if (ch === ' ') {
              frag.appendChild(document.createTextNode(' '));
              return;
            }
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = ch;
            frag.appendChild(span);
            chars.push(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
    return chars;
  };

  // Chamada uma unica vez quando o preloader sai. Hoisted de proposito: o
  // `finishLoading` acima a invoca antes desta linha no arquivo.
  function onLoaderDone() {
    if (!hasGsap) return;
    // O loader mantem `overflow: hidden` no body; triggers medidos antes disso
    // ficariam com posicoes erradas.
    ScrollTrigger.refresh();
    if (animate) playHeroIntro();
  }

  function playHeroIntro() {
    const title = document.querySelector('.hero--video .hero__title');
    if (!title) return;

    const lines = [...title.querySelectorAll('.title-line')];
    const chars = lines.flatMap((line) => splitChars(line.querySelector('span')));
    if (!chars.length) return;

    // O h1 ja carrega o texto completo em aria-label; os cacos viram ruido.
    lines.forEach((line) => line.setAttribute('aria-hidden', 'true'));

    // O CSS deslocou o <span> da linha para o fallback sem GSAP. Com GSAP quem
    // se move sao os caracteres, entao o pai volta para a posicao neutra.
    gsap.set(lines.map((l) => l.querySelector('span')), { y: 0, clearProps: 'transition' });

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.from(chars, { yPercent: 130, duration: .9, stagger: .02 })
      .from('.hero--video .eyebrow', { autoAlpha: 0, y: 16, duration: .6 }, '<.1')
      .from('.hero--video .hero__bottom p, .hero--video .hero__actions > *', {
        autoAlpha: 0, y: 24, duration: .7, stagger: .09, ease: 'power3.out',
      }, '-=.5')
      .from('.hero-video__meta, .hero--video .hero__side, .hero--video .hero__status', {
        autoAlpha: 0, duration: .8,
      }, '-=.4');
  }

  const header = document.querySelector('.site-header');
  const progressBar = document.querySelector('.scroll-progress span');
  const hero = document.querySelector('.hero--video');
  const heroContent = document.querySelector('.hero--video .hero__content');
  const heroVideo = document.querySelector('.hero-video');
  const heroMedia = document.querySelector('.hero-video__media');
  const heroOverlay = document.querySelector('.hero-video__overlay');
  const heroStatus = document.querySelector('.hero--video .hero__status');
  const heroMeta = document.querySelector('.hero-video__meta');
  const heroWash = document.querySelector('.hero__transition-wash');
  const portraitMedia = document.querySelector('.about-portrait__media');
  const portraitImage = document.querySelector('.about-portrait__media img');
  const motionStory = document.querySelector('.motion-story');
  const motionCards = [...document.querySelectorAll('.motion-card')];
  if (motionStory) motionStory.style.setProperty('--cases', String(motionCards.length || 4));
  const motionSteps = [...document.querySelectorAll('.motion-story__steps li')];
  const motionCounter = document.querySelector('.motion-story__counter');
  const motionProgress = document.querySelector('.motion-story__progress span');
  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  let scrollFrame = 0;

  const updateHeroScene = (top) => {
    if (!hero || reducedMotion) return;
    const range = Math.max(hero.offsetHeight - window.innerHeight, 1);
    const progress = clamp((top - hero.offsetTop) / range);
    const fade = 1 - clamp((progress - 0.08) / 0.42);
    // Faixa curta de proposito: acima de ~0.2 a cortina deixa de ser passagem
    // e o olho passa a ler uma tela inteira a mais entre o hero e a proxima secao.
    const wash = clamp((progress - 0.82) / 0.18);

    heroContent.style.opacity = String(fade);
    heroContent.style.transform = `translate3d(0, ${progress * -20}vh, 0) scale(${1 - progress * 0.06})`;
    heroStatus.style.opacity = String(1 - clamp(progress / 0.3));
    heroMeta.style.opacity = String(1 - clamp(progress / 0.28));
    heroMedia.style.transform = `scale(${1 + progress * 0.12}) translate3d(0, ${progress * -2.5}%, 0)`;
    heroVideo.style.transform = `scale(${1.08 + progress * 0.17})`;
    heroOverlay.style.opacity = String(1 - progress * 0.15);
    heroWash.style.transform = `translate3d(0, ${(1 - wash) * 105}%, 0)`;
    // Cortina fechada: o palco sai de cena e o manifesto (que ja esta por baixo) assume.
    hero.classList.toggle('is-past', progress >= 0.995);
  };

  const updatePortraitParallax = () => {
    if (!portraitMedia || !portraitImage || reducedMotion) return;
    const rect = portraitMedia.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const progress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
    portraitImage.style.transform = `translate3d(0, ${-7 + progress * 7}%, 0) scale(1.05)`;
  };

  const updateMotionStory = () => {
    // Sem corte por largura: a cena roda tambem no celular (o CSS recompoe o palco).
    if (!motionStory || reducedMotion) return;
    const total = motionCards.length;
    if (!total) return;

    const rect = motionStory.getBoundingClientRect();
    const range = Math.max(motionStory.offsetHeight - window.innerHeight, 1);
    const progress = clamp(-rect.top / range);
    const activeIndex = Math.min(total - 1, Math.floor(clamp(progress + 0.035) * total));

    // Tempos calibrados para 4 cases (0.22 entre entradas) e escalados por 4/total:
    // a altura da secao cresce na mesma proporcao (--cases), entao cada case ocupa
    // a mesma distancia de rolagem, qualquer que seja a quantidade.
    const k = 4 / total;

    motionProgress.style.width = `${progress * 100}%`;
    motionCounter.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    motionSteps.forEach((step, index) => step.classList.toggle('is-active', index === activeIndex));

    motionCards.forEach((card, index) => {
      const start = index * 0.22 * k;
      const enter = clamp((progress - start) / (0.11 * k));
      const exit = clamp((progress - (start + 0.16 * k)) / (0.11 * k));
      const x = 112 * (1 - enter) - 125 * exit;
      const y = (index % 2 === 0 ? 1 : -1) * (1 - enter) * 7 + exit * 5;
      const rotate = 6 * (1 - enter) - 5 * exit;
      const scale = 0.86 + enter * 0.14 - exit * 0.08;
      const opacity = clamp(enter * 1.8) * (1 - exit);

      card.style.zIndex = String(index + 1);
      card.style.opacity = String(opacity);
      card.style.transform = `translate3d(${x}%, ${y}%, 0) rotate(${rotate}deg) scale(${scale})`;
    });
  };

  const renderScrollScenes = () => {
    scrollFrame = 0;
    const top = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    header.classList.toggle('is-scrolled', top > 40);
    progressBar.style.width = `${max > 0 ? (top / max) * 100 : 0}%`;
    updateHeroScene(top);
    updatePortraitParallax();
    updateMotionStory();
  };

  const onScroll = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScrollScenes);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  renderScrollScenes();

  if (heroVideo) {
    // Sem controle de play: o vídeo é decorativo e roda em loop contínuo.
    const keepPlaying = () => {
      if (document.hidden) return;
      const attempt = heroVideo.play();
      if (attempt) attempt.catch(() => {});
    };

    heroVideo.addEventListener('canplay', keepPlaying);
    heroVideo.addEventListener('pause', keepPlaying);
    document.addEventListener('visibilitychange', keepPlaying);
    keepPlaying();
  }

  const reveals = document.querySelectorAll('.reveal');

  if (animate) {
    // O GSAP assume: neutraliza o sistema antigo para as duas opacidades nao brigarem.
    reveals.forEach((element) => element.classList.add('is-visible'));
    setupScrollReveals();
  } else if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    reveals.forEach((element) => revealObserver.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add('is-visible'));
  }

  // Mascara por PALAVRA, nao por linha: preserva <em> e <br> dentro do titulo e
  // dispensa re-split no resize (uma quebra de linha nova nao invalida nada).
  function splitWords(el) {
    const inners = [];
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          if (!child.textContent.trim()) return;
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            const outer = document.createElement('span');
            outer.className = 'w';
            const inner = document.createElement('span');
            inner.className = 'w-in';
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
            inners.push(inner);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
    return inners;
  }

  function revealWords(selector, opts = {}) {
    document.querySelectorAll(selector).forEach((el) => {
      const words = splitWords(el);
      if (!words.length) return;
      gsap.from(words, {
        yPercent: 130,
        duration: opts.duration || 1,
        ease: 'power4.out',
        stagger: opts.stagger || .045,
        scrollTrigger: { trigger: el, start: opts.start || 'top 82%', once: true },
      });
    });
  }

  function batchReveal(selector, opts = {}) {
    const items = document.querySelectorAll(selector);
    if (!items.length) return;
    gsap.set(items, { y: opts.y || 36, autoAlpha: 0 });
    ScrollTrigger.batch(items, {
      start: opts.start || 'top 85%',
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        y: 0,
        autoAlpha: 1,
        duration: opts.duration || .8,
        ease: 'power3.out',
        stagger: opts.stagger || .12,
        overwrite: true,
      }),
    });
  }

  function setupScrollReveals() {
    // 1. Titulos grandes — mascara de palavra com cascata
    revealWords('.display-title', { stagger: .05 });
    revealWords('.principles__sticky h2', { stagger: .05 });
    revealWords('.proof h2', { stagger: .05 });
    revealWords('.motion-story__intro h2', { stagger: .05 });
    revealWords('.about-profile__copy h3', { stagger: .04 });

    // 2. Grupos — cadencia propria por seccao
    batchReveal('.principle-card', { stagger: .15 });
    batchReveal('.process-list li', { stagger: .12 });
    batchReveal('.service-item', { stagger: .1, y: 28 });
    batchReveal('.proof__stats article', { stagger: .14 });
    batchReveal('.conversion-map article', { stagger: .12, y: 28 });
    batchReveal('.review', { stagger: .12, y: 34 });
    batchReveal('.rating, .testimonials__actions', { stagger: .12, y: 24 });
    batchReveal('.site-footer__main > *', { stagger: .12, y: 40, start: 'top 88%' });

    // 3. Micro-elementos de leitura — entram sozinhos, sem cascata
    batchReveal('.section-index', { y: 20, duration: .6, stagger: 0 });
    batchReveal([
      '.manifesto__copy p',
      '.services__heading > p',
      '.process__heading > p',
      '.principles__sticky > p',
      '.proof__content > p',
      '.motion-story__intro p',
    ].join(','), { y: 24, duration: .7, stagger: 0 });

    // 4. Retrato — o clip-path ja existe em CSS, so troca o gatilho
    const portrait = document.querySelector('.about-portrait');
    if (portrait) {
      ScrollTrigger.create({
        trigger: portrait,
        start: 'top 78%',
        once: true,
        onEnter: () => portrait.classList.add('is-visible'),
      });
    }

    setupSectionScenes();
    // Os .motion-card sao dirigidos pelo rAF (updateMotionStory) em toda largura —
    // nao podem receber reveal do GSAP, senao as duas fontes brigam pelo transform.
  }

  function setupSectionScenes() {
    // D9 — as estrelas da nota entram uma a uma quando o bloco aparece
    const estrelas = document.querySelectorAll('.rating__stars svg');
    if (estrelas.length) {
      ScrollTrigger.create({
        trigger: '.rating',
        start: 'top 88%',
        once: true,
        onEnter: () => gsap.from(estrelas, {
          scale: 0, transformOrigin: '50% 50%', duration: .5, ease: 'back.out(2.4)', stagger: .09, delay: .25,
        }),
      });
    }

    // D1 — a linha do mapa de conversao se desenha da esquerda para a direita
    const mapLine = document.querySelector('.conversion-map__line');
    if (mapLine) {
      gsap.from(mapLine, {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.2,
        ease: 'power2.inOut',
        scrollTrigger: { trigger: '.conversion-map', start: 'top 82%', once: true },
      });
    }

    // D2 — a fita acelera com a velocidade da rolagem e assenta de volta em 1x
    const track = document.querySelector('.marquee__track');
    if (track) {
      gsap.set(track, { animation: 'none' });          // desliga o keyframe CSS
      const loop = gsap.to(track, { xPercent: -50, repeat: -1, duration: 24, ease: 'none' });
      ScrollTrigger.create({
        onUpdate: (self) => {
          const boost = Math.min(Math.abs(self.getVelocity()) / 900, 3);
          gsap.to(loop, { timeScale: 1 + boost, duration: .4, overwrite: true });
        },
      });
    }

    // D4 — os icones dos principios se desenham (sem plugin: dasharray na mao)
    document.querySelectorAll('.principle-card').forEach((card, index) => {
      const shapes = card.querySelectorAll('svg path, svg circle, svg line, svg rect');
      if (!shapes.length) return;
      shapes.forEach((shape) => {
        if (typeof shape.getTotalLength !== 'function') return;
        const len = shape.getTotalLength();
        if (!len) return;
        gsap.set(shape, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(shape, {
          strokeDashoffset: 0,
          duration: 1.3,
          ease: 'power2.out',
          delay: index * .15,
          scrollTrigger: { trigger: card, start: 'top 85%', once: true },
        });
      });
    });

    // D6 — trilho vertical que acompanha a leitura das etapas
    const processList = document.querySelector('.process-list');
    const processBar = document.querySelector('.process-list__progress');
    if (processList && processBar) {
      gsap.fromTo(processBar, { scaleY: 0 }, {
        scaleY: 1,
        transformOrigin: 'top center',
        ease: 'none',
        scrollTrigger: { trigger: processList, start: 'top 70%', end: 'bottom 65%', scrub: .6 },
      });
    }

    // D7 — os numeros da prova contam ate o valor (lido do proprio HTML).
    // O zero so entra quando o trigger dispara: passar `scrollTrigger` direto ao
    // tween aplicaria o estado inicial na carga e deixaria "00 / 0%" na tela se
    // o trigger nunca chegasse a rodar.
    document.querySelectorAll('.proof__stats strong').forEach((el) => {
      const bruto = el.textContent.trim();
      const alvo = parseInt(bruto, 10);
      if (Number.isNaN(alvo)) return;
      const temPercent = bruto.includes('%');
      const casas = temPercent ? 0 : bruto.replace('%', '').length;

      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          const contador = { v: 0 };
          gsap.to(contador, {
            v: alvo,
            duration: 1.6,
            ease: 'power2.out',
            snap: { v: 1 },
            onUpdate: () => {
              const n = Math.round(contador.v);
              el.textContent = temPercent ? `${n}%` : String(n).padStart(casas, '0');
            },
            onComplete: () => { el.textContent = bruto; },   // fecha no valor exato do HTML
          });
        },
      });
    });

    // D8 — o titulo do CTA sobe palavra a palavra, e a acao entra depois
    const ctaTitle = document.querySelector('.cta h2');
    if (ctaTitle) {
      const words = splitWords(ctaTitle);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '.cta', start: 'top 70%', once: true },
      });
      tl.from('.cta .kicker', { autoAlpha: 0, y: 16, duration: .6, ease: 'power3.out' })
        .from(words, { yPercent: 120, duration: .9, ease: 'power4.out', stagger: .04 }, '-=.35')
        .from('.cta__action', { autoAlpha: 0, y: 20, duration: .7, ease: 'power3.out' }, '-=.4');
    }
  }

  const menuToggle = document.querySelector('.menu-toggle');
  const menuPanel = document.querySelector('.menu-panel');
  const closeMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    menuPanel.setAttribute('aria-hidden', 'true');
    menuPanel.classList.remove('is-open');
    body.classList.remove('menu-open');
  };

  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') === 'true';
    if (open) closeMenu();
    else {
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Fechar menu');
      menuPanel.setAttribute('aria-hidden', 'false');
      menuPanel.classList.add('is-open');
      body.classList.add('menu-open');
      // D10 — os links entram em cascata depois que a cortina (clip-path) abre
      if (animate) {
        gsap.fromTo(menuPanel.querySelectorAll('nav a'),
          { y: 34, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: .55, ease: 'power3.out', stagger: .055, delay: .18 });
      }
    }
  });

  menuPanel.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  document.querySelectorAll('.service-item button').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.service-item');
      const isOpen = item.classList.contains('is-open');

      document.querySelectorAll('.service-item').forEach((otherItem) => {
        otherItem.classList.remove('is-open');
        otherItem.querySelector('button').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        // D3 — o conteudo do painel entra em cascata junto com o max-height
        if (animate) {
          gsap.from(item.querySelectorAll('.service-item__panel p, .service-item__panel > span'), {
            y: 14, autoAlpha: 0, duration: .45, ease: 'power3.out', stagger: .08, delay: .1,
          });
        }
      }
    });
  });

  const cursor = document.querySelector('.cursor');
  if (cursor && window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
    const cursorInner = cursor.querySelector('.cursor__inner');
    const ALVOS = 'a, button, [data-cursor]';

    if (hasGsap) {
      // quickTo tem seu proprio suavizador: dispensa o rAF paralelo que existia aqui.
      const moveX = gsap.quickTo(cursor, 'x', { duration: .25, ease: 'power3' });
      const moveY = gsap.quickTo(cursor, 'y', { duration: .25, ease: 'power3' });
      window.addEventListener('pointermove', (event) => {
        moveX(event.clientX);
        moveY(event.clientY);
        cursor.classList.add('is-visible');
      });
    } else {
      let mouseX = -100, mouseY = -100, cursorX = -100, cursorY = -100;
      window.addEventListener('pointermove', (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
        cursor.classList.add('is-visible');
      });
      const renderCursor = () => {
        cursorX += (mouseX - cursorX) * 0.18;
        cursorY += (mouseY - cursorY) * 0.18;
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
        requestAnimationFrame(renderCursor);
      };
      renderCursor();
    }

    // Delegacao: vale para qualquer link/botao, inclusive os criados depois.
    document.addEventListener('pointerover', (event) => {
      const alvo = event.target.closest && event.target.closest(ALVOS);
      if (!alvo) return;
      cursor.classList.add('cursor--link');
      cursorInner.textContent = alvo.getAttribute('data-cursor') || '';
    });

    document.addEventListener('pointerout', (event) => {
      const alvo = event.target.closest && event.target.closest(ALVOS);
      if (!alvo) return;
      if (event.relatedTarget && event.relatedTarget.closest && event.relatedTarget.closest(ALVOS) === alvo) return;
      cursor.classList.remove('cursor--link');
      cursorInner.textContent = '';
    });
  }

  // Carrossel de avaliacoes: rolagem nativa com snap; as setas so empurram o trilho.
  // Nao depende de GSAP — precisa funcionar mesmo se a CDN cair.
  const reviewTrack = document.querySelector('.reviews__track');
  if (reviewTrack) {
    const botoes = [...document.querySelectorAll('.reviews__btn')];
    const passo = () => {
      const card = reviewTrack.querySelector('.review');
      const gap = parseFloat(getComputedStyle(reviewTrack).columnGap) || 0;
      return card ? card.getBoundingClientRect().width + gap : reviewTrack.clientWidth * 0.8;
    };

    const atualizarSetas = () => {
      const max = reviewTrack.scrollWidth - reviewTrack.clientWidth;
      botoes.forEach((b) => {
        const dir = Number(b.dataset.dir);
        b.disabled = dir < 0 ? reviewTrack.scrollLeft <= 2 : reviewTrack.scrollLeft >= max - 2;
      });
    };

    botoes.forEach((b) => b.addEventListener('click', () => {
      reviewTrack.scrollBy({ left: Number(b.dataset.dir) * passo(), behavior: reducedMotion ? 'auto' : 'smooth' });
    }));

    reviewTrack.addEventListener('scroll', atualizarSetas, { passive: true });
    window.addEventListener('resize', atualizarSetas, { passive: true });

    // "Ler mais" so onde o texto de fato passa das 6 linhas (medido, nao chutado).
    const prepararLerMais = () => {
      reviewTrack.querySelectorAll('.review').forEach((card) => {
        const texto = card.querySelector('.review__text');
        if (!texto || card.querySelector('.review__more')) return;
        texto.classList.add('is-clamped');
        if (texto.scrollHeight <= texto.clientHeight + 1) {
          texto.classList.remove('is-clamped');
          return;
        }
        const mais = document.createElement('button');
        mais.type = 'button';
        mais.className = 'review__more';
        mais.textContent = 'Ler mais';
        mais.setAttribute('aria-expanded', 'false');
        mais.addEventListener('click', () => {
          const aberto = texto.classList.toggle('is-clamped') === false;
          mais.textContent = aberto ? 'Ler menos' : 'Ler mais';
          mais.setAttribute('aria-expanded', String(aberto));
        });
        card.appendChild(mais);
      });
    };

    prepararLerMais();
    atualizarSetas();
    // Fontes carregam depois e mudam a quebra de linha: remede quando terminarem.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { atualizarSetas(); });
    }
  }

  // Botoes magneticos: so nos dois CTAs principais e so com ponteiro fino.
  if (animate && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.cta__action, .hero__actions .pill--gold').forEach((el) => {
      const puxarX = gsap.quickTo(el, 'x', { duration: .35, ease: 'power3' });
      const puxarY = gsap.quickTo(el, 'y', { duration: .35, ease: 'power3' });

      el.addEventListener('pointermove', (event) => {
        const r = el.getBoundingClientRect();
        puxarX((event.clientX - (r.left + r.width / 2)) * .25);
        puxarY((event.clientY - (r.top + r.height / 2)) * .25);
      });

      // Volta pelas mesmas funcoes: um `gsap.to` novo brigaria com o tween do quickTo.
      el.addEventListener('pointerleave', () => {
        puxarX(0);
        puxarY(0);
      });
    });
  }

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
})();
