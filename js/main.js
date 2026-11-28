(() => {
  'use strict';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Печатающийся заголовок-роль ---------- */
  const typedEl = document.getElementById('typed');
  if (typedEl && !reduceMotion) {
    // Добавьте сюда другие роли — они будут сменять друг друга.
    const words = ['Full-stack Разработчик', 'Frontend Разработчик', 'Backend Разработчик', 'Full-stack Разработчик'];
    let w = 0, i = typedEl.textContent.length, deleting = true;
    const caret = document.querySelector('.caret');

    const tick = () => {
      const word = words[w];
      typedEl.textContent = word.slice(0, i);
      let delay = deleting ? 38 : 75;

      if (!deleting && i === word.length) {            // дописали
        deleting = true; delay = 2600;
        if (w === words.length - 1) { return; }        // последняя — остаёмся как на макете
      } else if (deleting && i === 0) {                // стёрли
        deleting = false; w = (w + 1) % words.length; delay = 350;
      } else {
        i += deleting ? -1 : 1;
      }
      setTimeout(tick, delay);
    };
    // Стартуем после появления блока и первой паузы на макетном тексте
    setTimeout(tick, 3800);
    caret && (caret.style.animationDuration = '1s');
  }

  /* ---------- 2. Навигация: скользящий индикатор + scroll-spy ---------- */
  const nav = document.querySelector('.nav');
  const indicator = document.querySelector('.nav__indicator');
  const links = [...document.querySelectorAll('.nav__link')];

  const moveIndicator = (link) => {
    if (!link || !indicator) return;
    indicator.style.width = link.offsetWidth + 'px';
    indicator.style.transform = `translateX(${link.offsetLeft}px)`;
  };
  const setActive = (link) => {
    links.forEach(l => l.classList.toggle('is-active', l === link));
    requestAnimationFrame(() => moveIndicator(link));
  };

  // индикатор без анимации при первом позиционировании
  indicator.style.transition = 'none';
  moveIndicator(links[0]);
  requestAnimationFrame(() => requestAnimationFrame(() => (indicator.style.transition = '')));
  document.fonts && document.fonts.ready.then(() => moveIndicator(nav.querySelector('.is-active')));
  addEventListener('resize', () => {
    indicator.style.transition = 'none';
    moveIndicator(nav.querySelector('.is-active'));
    requestAnimationFrame(() => (indicator.style.transition = ''));
  });

  let lockSpy = false, lockTimer;
  links.forEach(link => link.addEventListener('click', () => {
    lockSpy = true; clearTimeout(lockTimer);
    lockTimer = setTimeout(() => (lockSpy = false), 900);
    setActive(link);
  }));

  const sections = links.map(l => document.getElementById(l.dataset.section)).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    if (lockSpy) return;
    entries.forEach(e => {
      if (e.isIntersecting) setActive(links.find(l => l.dataset.section === e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  /* ---------- 3. Ripple на кнопках ---------- */
  document.querySelectorAll('[data-ripple]').forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const s = document.createElement('span');
      s.className = 'ripple';
      s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      btn.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    });
  });

  /* ---------- 4. Параллакс маскота за курсором ---------- */
  const art = document.querySelector('.hero__art');
  const mascot = document.getElementById('mascot');
  if (art && mascot && !reduceMotion && matchMedia('(hover: hover)').matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf;
    const loop = () => {
      cx += (tx - cx) * .08; cy += (ty - cy) * .08;
      art.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = (Math.abs(tx - cx) > .05 || Math.abs(ty - cy) > .05) ? requestAnimationFrame(loop) : null;
    };
    addEventListener('pointermove', (e) => {
      tx = (e.clientX / innerWidth - .5) * -26;
      ty = (e.clientY / innerHeight - .5) * -18;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    // клик по маскоту — маленький «подпрыг»
    mascot.addEventListener('click', () => {
      mascot.animate(
        [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-2.4rem) scale(1.04)' }, { transform: 'translateY(0) scale(1)' }],
        { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' }
      );
    });
  }

  /* ---------- 5. Разделы: появление при прокрутке + параллакс ---------- */
  const panels = [...document.querySelectorAll('.about, .projects, .services, .contacts')];
  const spyIn = 'IntersectionObserver' in window
    ? new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); } }), { threshold: .2 })
    : null;
  panels.forEach(p => spyIn ? spyIn.observe(p) : p.classList.add('in'));

  if (!reduceMotion && matchMedia('(hover: hover)').matches && innerWidth > 1100) {
    panels.forEach(panel => {
      const art = panel.querySelector('.about__art, .art');
      if (!art) return;
      panel.addEventListener('pointermove', (e) => {
        const r = panel.getBoundingClientRect();
        const x = (e.clientX / innerWidth - .5) * -22, y = ((e.clientY - r.top) / r.height - .5) * -14;
        art.style.transition = 'opacity .8s var(--ease), transform .25s ease-out';
        art.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      panel.addEventListener('pointerleave', () => { art.style.transform = ''; });
    });
  }

  /* ---------- 6. Проекты: активная карточка следует за курсором ---------- */
  const pcards = [...document.querySelectorAll('.pcard')];
  pcards.forEach(card => {
    card.addEventListener('pointerenter', () => { pcards.forEach(c => c.classList.toggle('is-active', c === card)); });
    card.addEventListener('focus', () => { pcards.forEach(c => c.classList.toggle('is-active', c === card)); });
  });
  document.querySelectorAll('.pcard[href="#"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));

  /* ---------- 7. Контакты: копирование + уведомление ---------- */
  const toast = document.getElementById('toast');
  let toastTimer;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };
  document.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (_) {} t.remove();
    }
    showToast('Скопировано: ' + text);
  }));
})();
