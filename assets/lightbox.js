// ─── CASE STUDY LIGHTBOX ───
// Shared by index.html and case/*/index.html. Any .cs-zoom inside a .cs-gallery
// opens a full-screen viewer over that gallery's images. Uses event delegation,
// so galleries rendered after load (the index.html panel) work without setup.
(function () {
  let lb, imgEl, capEl, countEl, dotsEl, items = [], idx = 0, returnFocus = null, prevOverflow = '';

  const icon = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

  function build() {
    lb = document.createElement('div');
    lb.className = 'lb';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = `
      <div class="lb-top">
        <div class="lb-count" aria-live="polite"></div>
        <button type="button" class="lb-btn lb-close" aria-label="Close">${icon('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>')}</button>
      </div>
      <div class="lb-stage">
        <figure class="lb-figure">
          <img class="lb-img" alt="">
          <figcaption class="lb-caption"></figcaption>
        </figure>
      </div>
      <button type="button" class="lb-btn lb-prev" aria-label="Previous image">${icon('<polyline points="15 18 9 12 15 6"/>')}</button>
      <button type="button" class="lb-btn lb-next" aria-label="Next image">${icon('<polyline points="9 18 15 12 9 6"/>')}</button>
      <div class="lb-dots"></div>`;
    document.body.appendChild(lb);

    imgEl   = lb.querySelector('.lb-img');
    capEl   = lb.querySelector('.lb-caption');
    countEl = lb.querySelector('.lb-count');
    dotsEl  = lb.querySelector('.lb-dots');

    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', () => go(idx - 1));
    lb.querySelector('.lb-next').addEventListener('click', () => go(idx + 1));
    dotsEl.addEventListener('click', e => {
      const dot = e.target.closest('.lb-dot');
      if (dot) go(+dot.dataset.idx);
    });
    // Clicking the dark area around the image closes
    lb.addEventListener('click', e => {
      if (e.target === lb || e.target.classList.contains('lb-stage') || e.target.classList.contains('lb-top')) close();
    });

    let startX = 0;
    lb.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 44) go(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  function go(i) {
    idx = (i + items.length) % items.length;
    const it = items[idx];
    imgEl.src = it.src;
    imgEl.alt = it.alt;
    capEl.textContent = it.caption;
    capEl.hidden = !it.caption;
    countEl.textContent = `${idx + 1} / ${items.length}`;
    dotsEl.querySelectorAll('.lb-dot').forEach((d, n) => d.setAttribute('aria-current', n === idx ? 'true' : 'false'));
  }

  function open(gallery, start) {
    if (!lb) build();
    items = [...gallery.querySelectorAll('.cs-shot')].map(shot => {
      const img = shot.querySelector('img');
      const cap = shot.querySelector('.cs-caption');
      return { src: img.currentSrc || img.src, alt: img.alt, caption: cap ? cap.textContent.trim() : '' };
    });
    const multi = items.length > 1;
    lb.querySelector('.lb-prev').hidden = !multi;
    lb.querySelector('.lb-next').hidden = !multi;
    dotsEl.innerHTML = multi
      ? items.map((_, n) => `<button type="button" class="lb-dot" data-idx="${n}" aria-label="Image ${n + 1}"></button>`).join('')
      : '';

    returnFocus = document.activeElement;
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    go(start);
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('open'));
    lb.querySelector('.lb-close').focus();
  }

  function close() {
    if (!lb || lb.hidden) return;
    lb.classList.remove('open');
    lb.hidden = true;
    document.body.style.overflow = prevOverflow;
    if (returnFocus && returnFocus.focus) returnFocus.focus();
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('.cs-zoom');
    if (!btn) return;
    const gallery = btn.closest('.cs-gallery');
    const shots = [...gallery.querySelectorAll('.cs-shot')];
    open(gallery, shots.indexOf(btn.closest('.cs-shot')));
  });

  // Capture phase on window so Escape closes only the lightbox,
  // not the case-study panel underneath it on index.html.
  window.addEventListener('keydown', e => {
    if (!lb || lb.hidden) return;
    if (e.key === 'Escape')     { e.stopPropagation(); close(); }
    else if (e.key === 'ArrowLeft')  { e.stopPropagation(); go(idx - 1); }
    else if (e.key === 'ArrowRight') { e.stopPropagation(); go(idx + 1); }
    else if (e.key === 'Tab') {
      const f = [...lb.querySelectorAll('button')].filter(b => !b.hidden && b.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);
})();
