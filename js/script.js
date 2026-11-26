/* ==========================================================================
   ADZZ Restaurant  |  js/script.js
   Designed & Developed by MuadzMuttaqin
   --------------------------------------------------------------------------
   JavaScript murni (tanpa library). Semua class dan ID memakai awalan
   "muadzmuttaqin_" (konstanta P di bawah dipakai untuk membentuk nama class).
   DAFTAR ISI
    1. Util dan penyimpanan
    2. Tema gelap/terang
    3. Navbar, tombol kembali ke atas, toast
    4. Animasi masuk saat scroll (IntersectionObserver)
    5. Hero 3D: tilt + efek magnet
    6. Kartu menu 3D (tilt + bayangan dinamis)
    7. Stacking "Signature Dishes"
    8. Galeri flip + lightbox
    9. Slider testimoni 3D
   10. Teks scroll-reveal per huruf
   11. Filter menu
   12. Keranjang pesanan
   13. Validasi form (reservasi dan kontak)
   14. Maskot ADZZ Chef
   15. Inisialisasi
   ========================================================================== */
(function () {
  'use strict';

  /* ======================================================================
     1. UTIL DAN PENYIMPANAN
     ====================================================================== */
  const P = 'muadzmuttaqin_';                                   // awalan wajib class dan ID
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  // Efek berbasis kursor (tilt, magnet) hanya aktif di perangkat dengan kursor dan tanpa reduced-motion
  const use3D = canHover && !reduceMotion;

  // Pembuat elemen kecil (selalu memakai textContent, bukan innerHTML)
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // localStorage dibungkus try/catch supaya tidak error di mode privat
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* abaikan */ }
    }
  };

  // Satu handler scroll yang di-throttle dengan requestAnimationFrame
  const scrollHandlers = [];
  let scrollTicking = false;
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      scrollTicking = false;
      scrollHandlers.forEach(fn => fn());
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);


  /* ======================================================================
     2. TEMA GELAP / TERANG
     Pilihan disimpan di localStorage ("muadzmuttaqin_theme"). Nilai awal dipasang
     oleh script kecil di <head> agar tidak berkedip saat halaman dimuat.
     ====================================================================== */
  function initTheme() {
    const btn = $('#muadzmuttaqin_theme-toggle');
    if (!btn) return;
    const root = document.documentElement;
    const sync = () => {
      const light = root.dataset.theme === 'light';
      btn.setAttribute('aria-pressed', String(light));
      btn.setAttribute('aria-label', light ? 'Ganti ke mode gelap' : 'Ganti ke mode terang');
    };
    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.dataset.theme = next;
      try { localStorage.setItem('muadzmuttaqin_theme', next); } catch (e) { /* abaikan */ }
      sync();
    });
    sync();
  }


  /* ======================================================================
     3. NAVBAR, KEMBALI KE ATAS, TOAST
     ====================================================================== */
  let toastTimer = null;
  function showToast(message, isError) {
    const toast = $('#muadzmuttaqin_toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle(P + 'toast-error', Boolean(isError));
    toast.classList.add(P + 'show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove(P + 'show'), 3200);
  }

  function initChrome() {
    const header = $('#muadzmuttaqin_header');
    const list = $('#muadzmuttaqin_nav-list');
    const burger = $('#muadzmuttaqin_hamburger');
    const backTop = $('#muadzmuttaqin_backtop');

    // Efek latar navbar saat di-scroll + tampilkan tombol kembali ke atas
    const update = () => {
      const y = window.scrollY;
      if (header) header.classList.toggle(P + 'scrolled', y > 40);
      if (backTop) backTop.classList.toggle(P + 'show', y > 500);
    };
    scrollHandlers.push(update);
    update();

    // Menu hamburger (mobile)
    function setMenu(open) {
      if (!list || !burger) return;
      list.classList.toggle(P + 'open', open);
      burger.classList.toggle(P + 'open', open);
      burger.setAttribute('aria-expanded', String(open));
    }
    if (burger && list) {
      burger.addEventListener('click', () => setMenu(!list.classList.contains(P + 'open')));
      $$('a', list).forEach(a => a.addEventListener('click', () => setMenu(false)));
      window.addEventListener('resize', () => { if (window.innerWidth > 768) setMenu(false); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    }

    if (backTop) {
      backTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  }


  /* ======================================================================
     4. ANIMASI MASUK SAAT SCROLL
     Elemen .muadzmuttaqin_reveal naik dengan rotateX ke posisi normal
     (transform-nya ada di CSS, bagian 17) saat masuk layar.
     ====================================================================== */
  function initReveal() {
    const items = $$('.' + P + 'reveal');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(i => i.classList.add(P + 'revealed'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(P + 'revealed');
          io.unobserve(entry.target);            // cukup sekali
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    items.forEach(item => {
      // jeda bertahap untuk elemen bersaudara (maksimal 5 langkah)
      const siblings = item.parentElement
        ? Array.from(item.parentElement.children).filter(c => c.classList.contains(P + 'reveal'))
        : [];
      item.style.setProperty('--muadzmuttaqin_delay', Math.min(siblings.indexOf(item), 5) * 80 + 'ms');
      io.observe(item);
    });
  }


  /* ======================================================================
     5. HERO 3D: TILT + EFEK MAGNET
     ====================================================================== */
  function initHeroTilt() {
    const hero = $('#muadzmuttaqin_hero3d');
    const title = $('#muadzmuttaqin_hero-title');
    const photo = $('#muadzmuttaqin_hero-photo');
    // Layar sentuh / reduced-motion: tidak ada tilt (CSS memberi animasi melayang untuk layar sentuh)
    if (!hero || !title || !photo || !use3D) return;

    const target = { x: 0, y: 0 };     // posisi kursor ternormalisasi (-1 sampai 1)
    const now = { x: 0, y: 0 };        // posisi yang sedang ditampilkan (di-smooth)
    let frame = null;

    function render() {
      now.x += (target.x - now.x) * 0.12;
      now.y += (target.y - now.y) * 0.12;

      // rotateX / rotateY: sisi elemen condong menghadap kursor. Perspective ada di CSS (.hero-grid).
      title.style.transform = 'rotateX(' + (-now.y * 6).toFixed(2) + 'deg) rotateY(' + (now.x * 10).toFixed(2) + 'deg)';
      photo.style.transform = 'rotateX(' + (-now.y * 10).toFixed(2) + 'deg) rotateY(' + (now.x * 16).toFixed(2) + 'deg)';

      // Bayangan dinamis: bergeser berlawanan arah rotasi
      photo.style.setProperty('--muadzmuttaqin_sx', (-now.x * 34).toFixed(1) + 'px');
      photo.style.setProperty('--muadzmuttaqin_sy', (30 - now.y * 28).toFixed(1) + 'px');
      title.style.filter = 'drop-shadow(' + (-now.x * 14).toFixed(1) + 'px ' + (10 - now.y * 10).toFixed(1) + 'px 18px rgba(0,0,0,.55))';

      const moving = Math.abs(target.x - now.x) > 0.001 || Math.abs(target.y - now.y) > 0.001;
      frame = moving ? requestAnimationFrame(render) : null;
    }
    const kick = () => { if (!frame) frame = requestAnimationFrame(render); };

    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      kick();
    });
    hero.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; kick(); });
  }

  // Efek magnet: elemen [data-magnet="kekuatan"] tertarik ke kursor saat kursor berada dekat tepinya.
  // translate3d(dx / kekuatan, dy / kekuatan, 0): makin kecil angka kekuatan, makin kuat tarikannya.
  function initMagnet() {
    if (!use3D) return;
    const items = $$('[data-magnet]');
    if (!items.length) return;
    const RANGE = 70;   // jarak (px) dari tepi elemen yang sudah menarik

    function reset(item) { if (item.style.transform) item.style.transform = ''; }

    document.addEventListener('pointermove', e => {
      items.forEach(item => {
        const r = item.getBoundingClientRect();
        const near = e.clientX > r.left - RANGE && e.clientX < r.right + RANGE &&
                     e.clientY > r.top - RANGE && e.clientY < r.bottom + RANGE;
        if (!near) { reset(item); return; }
        const strength = parseFloat(item.dataset.magnet) || 10;
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        item.style.transform = 'translate3d(' + (dx / strength).toFixed(1) + 'px,' + (dy / strength).toFixed(1) + 'px,0)';
      });
    });
    document.documentElement.addEventListener('mouseleave', () => items.forEach(reset));
  }


  /* ======================================================================
     6. KARTU MENU 3D (tilt + bayangan dinamis)
     CSS membaca variabel --muadzmuttaqin_rx / _ry / _sx / _sy (lihat bagian 11 style.css)
     ====================================================================== */
  function initCardTilt() {
    if (!use3D) return;
    const MAX = window.innerWidth < 768 ? 5 : 10;     // sudut maksimum (derajat)
    $$('.' + P + 'card3d').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;     // -0.5 sampai 0.5
        const py = (e.clientY - r.top) / r.height - 0.5;
        const ry = px * 2 * MAX;
        const rx = -py * 2 * MAX;
        card.style.setProperty('--muadzmuttaqin_rx', rx.toFixed(2) + 'deg');
        card.style.setProperty('--muadzmuttaqin_ry', ry.toFixed(2) + 'deg');
        // bayangan bergerak berlawanan arah rotasi
        card.style.setProperty('--muadzmuttaqin_sx', (-ry * 2.4).toFixed(1) + 'px');
        card.style.setProperty('--muadzmuttaqin_sy', (14 + rx * 2.4).toFixed(1) + 'px');
      });
      card.addEventListener('pointerleave', () => {
        ['rx', 'ry', 'sx', 'sy'].forEach(k => card.style.removeProperty('--muadzmuttaqin_' + k));
      });
    });
  }


  /* ======================================================================
     7. STACKING "SIGNATURE DISHES"
     Kartu memakai position: sticky (CSS). Di sini dihitung seberapa jauh kartu
     berikutnya menutupi kartu ini, lalu scale / rotateX / gelap diatur sesuai itu.
     ====================================================================== */
  function initStack() {
    const cards = $$('.' + P + 'stack-card');
    if (cards.length < 2 || reduceMotion) return;

    const update = () => {
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        let p = 0;                                     // progres tertutup: 0 sampai 1
        if (next) {
          const height = card.offsetHeight;
          const bottom = card.getBoundingClientRect().top + height;   // tinggi asli (sebelum scale)
          p = clamp((bottom - next.getBoundingClientRect().top) / height, 0, 1);
        }
        card.style.setProperty('--muadzmuttaqin_s', (1 - p * 0.07).toFixed(4));
        card.style.setProperty('--muadzmuttaqin_r', (p * 4).toFixed(2) + 'deg');
        card.style.setProperty('--muadzmuttaqin_dim', (p * 0.55).toFixed(3));
      });
    };
    scrollHandlers.push(update);
    update();
  }


  /* ======================================================================
     8. GALERI FLIP + LIGHTBOX
     - Desktop (ada kursor): hover membalik kartu, klik membuka lightbox
     - Layar sentuh: ketuk membalik kartu, tombol "Perbesar foto" membuka lightbox
     - Keyboard: Tab fokus ke kartu (otomatis terbalik), Enter membalik, tombol Perbesar membuka lightbox
     ====================================================================== */
  function initGallery() {
    const cards = $$('.' + P + 'flip');
    const box = $('#muadzmuttaqin_lightbox');
    if (!cards.length || !box) return;
    const img = $('#muadzmuttaqin_lightbox-img');
    const cap = $('#muadzmuttaqin_lightbox-cap');
    const closeBtn = $('#muadzmuttaqin_lightbox-close');
    let lastFocus = null;

    function open(card) {
      const src = $('img', card);
      img.src = src.currentSrc || src.src;
      img.alt = src.alt;
      cap.textContent = card.dataset.caption || '';
      lastFocus = document.activeElement;
      box.classList.add(P + 'open');
      box.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function close() {
      if (!box.classList.contains(P + 'open')) return;
      box.classList.remove(P + 'open');
      box.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }

    cards.forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.' + P + 'zoom-btn')) { open(card); return; }
        if (canHover) open(card);
        else card.classList.toggle(P + 'flipped');
      });
      card.addEventListener('keydown', e => {
        if (e.target === card && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          card.classList.toggle(P + 'flipped');
        }
      });
    });
    closeBtn.addEventListener('click', close);
    box.addEventListener('click', e => { if (e.target === box) close(); });
    box.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }


  /* ======================================================================
     9. SLIDER TESTIMONI 3D
     JS hanya mengisi --muadzmuttaqin_o (jarak dari kartu aktif, bisa negatif) dan
     --muadzmuttaqin_abs. Posisi 3D-nya dihitung di CSS (bagian 14 style.css).
     ====================================================================== */
  function initSlider() {
    const root = $('#muadzmuttaqin_slider');
    if (!root) return;
    const slides = $$('.' + P + 'slide', root);
    const dotsBox = $('#muadzmuttaqin_slider-dots');
    const prevBtn = $('#muadzmuttaqin_slider-prev');
    const nextBtn = $('#muadzmuttaqin_slider-next');
    const toggleBtn = $('#muadzmuttaqin_slider-toggle');
    const n = slides.length;
    let active = 0;
    let timer = null;
    let userPaused = reduceMotion;          // reduced-motion: tidak auto-play

    const dots = slides.map((_, i) => {
      const dot = el('button', P + 'dot');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Tampilkan testimoni ' + (i + 1));
      dot.addEventListener('click', () => { go(i); restart(); });
      dotsBox.appendChild(dot);
      return dot;
    });

    function render() {
      slides.forEach((slide, i) => {
        let off = i - active;
        if (off > n / 2) off -= n;                 // posisi melingkar
        if (off < -n / 2) off += n;
        const abs = Math.abs(off);
        slide.style.setProperty('--muadzmuttaqin_o', off);
        slide.style.setProperty('--muadzmuttaqin_abs', abs);
        slide.dataset.abs = abs;
        slide.style.zIndex = 10 - abs;
        slide.setAttribute('aria-hidden', abs === 0 ? 'false' : 'true');
      });
      dots.forEach((d, i) => {
        d.classList.toggle(P + 'active', i === active);
        d.setAttribute('aria-current', i === active ? 'true' : 'false');
      });
    }
    function go(i) { active = (i + n) % n; render(); }
    function next() { go(active + 1); }
    function prev() { go(active - 1); }

    function start() { if (!timer && !userPaused) timer = setInterval(next, 5000); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    prevBtn.addEventListener('click', () => { prev(); restart(); });
    nextBtn.addEventListener('click', () => { next(); restart(); });
    slides.forEach((slide, i) => slide.addEventListener('click', () => { if (i !== active) { go(i); restart(); } }));

    // Jeda saat kursor/fokus berada di slider atau tab tidak terlihat
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    root.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { prev(); restart(); }
      if (e.key === 'ArrowRight') { next(); restart(); }
    });

    // Geser (swipe) di layar sentuh
    let touchX = null;
    root.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', e => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 45) { dx < 0 ? next() : prev(); restart(); }
    });

    // Tombol jeda/putar auto-play (aksesibilitas)
    function syncToggle() {
      toggleBtn.textContent = userPaused ? 'Putar otomatis' : 'Jeda';
      toggleBtn.setAttribute('aria-pressed', String(userPaused));
    }
    toggleBtn.addEventListener('click', () => {
      userPaused = !userPaused;
      syncToggle();
      if (userPaused) stop(); else start();
    });

    syncToggle();
    render();
    start();
  }


  /* ======================================================================
     10. TEKS SCROLL-REVEAL PER HURUF (about.html)
     Teks dipecah menjadi <span> per huruf; opacity tiap huruf naik dari 0.2 ke 1
     mengikuti posisi scroll. Teks asli disimpan di aria-label untuk pembaca layar.
     ====================================================================== */
  function initCharReveal() {
    const box = $('#muadzmuttaqin_reveal-text');
    if (!box) return;
    const text = box.textContent.trim().replace(/\s+/g, ' ');
    box.setAttribute('aria-label', text);
    box.textContent = '';

    const chars = [];
    const words = text.split(' ');
    words.forEach((word, wi) => {
      const w = el('span', P + 'word');
      w.setAttribute('aria-hidden', 'true');
      Array.from(word).forEach(ch => {
        const c = el('span', P + 'char', ch);
        w.appendChild(c);
        chars.push(c);
      });
      box.appendChild(w);
      if (wi < words.length - 1) box.appendChild(document.createTextNode(' '));
    });
    if (reduceMotion) { chars.forEach(c => { c.style.opacity = 1; }); return; }

    const update = () => {
      const r = box.getBoundingClientRect();
      const vh = window.innerHeight;
      // progres 0 saat paragraf mulai muncul (atas di 85% layar), 1 saat bawahnya mencapai 45% layar
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.4), 0, 1);
      const total = chars.length;
      chars.forEach((c, i) => {
        const o = 0.2 + 0.8 * clamp((p - (i / total) * 0.9) / 0.1, 0, 1);
        c.style.opacity = o.toFixed(2);
      });
    };
    scrollHandlers.push(update);
    update();
  }


  /* ======================================================================
     11. FILTER MENU
     ====================================================================== */
  function initMenuFilter() {
    const buttons = $$('.' + P + 'filter-btn');
    const items = $$('[data-category]');
    const status = $('#muadzmuttaqin_filter-status');
    if (!buttons.length || !items.length) return;

    buttons.forEach(btn => btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      buttons.forEach(b => {
        const on = b === btn;
        b.classList.toggle(P + 'active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      let shown = 0;
      items.forEach(item => {
        const match = f === 'semua' || item.dataset.category === f;
        item.hidden = !match;
        if (match) shown++;
      });
      if (status) status.textContent = 'Menampilkan ' + shown + ' hidangan';
    }));
  }


  /* ======================================================================
     12. KERANJANG PESANAN
     Isi keranjang disimpan di localStorage ("muadzmuttaqin_cart") sehingga tetap ada
     saat pindah halaman. Badge jumlah item di navbar diperbarui di semua halaman.
     ====================================================================== */
  const CART_KEY = 'muadzmuttaqin_cart';
  const rupiah = n => 'Rp ' + Number(n).toLocaleString('id-ID');

  function loadCart() {
    const raw = store.get(CART_KEY, {});
    const clean = {};
    if (raw && typeof raw === 'object') {
      Object.keys(raw).forEach(id => {
        const it = raw[id];
        if (it && typeof it.name === 'string' && Number.isFinite(it.price) &&
            Number.isInteger(it.qty) && it.qty > 0 && it.qty < 100) {
          clean[id] = { name: it.name.slice(0, 80), price: it.price, qty: it.qty };
        }
      });
    }
    return clean;
  }
  let cart = loadCart();

  const cartCount = () => Object.keys(cart).reduce((sum, id) => sum + cart[id].qty, 0);

  function renderBadge() {
    const count = cartCount();
    $$('.' + P + 'cart-badge').forEach(b => {
      b.textContent = count;
      b.hidden = count === 0;
    });
  }

  function renderCart() {
    const list = $('#muadzmuttaqin_cart-list');
    if (!list) return;                                  // hanya ada di menu.html
    list.textContent = '';
    const ids = Object.keys(cart);
    let total = 0;

    ids.forEach(id => {
      const it = cart[id];
      const sub = it.price * it.qty;
      total += sub;

      const li = el('li', P + 'cart-item');
      li.dataset.item = id;
      const info = el('div', P + 'cart-info');
      info.appendChild(el('p', P + 'cart-name', it.name));
      info.appendChild(el('p', P + 'cart-sub', rupiah(it.price) + ' x ' + it.qty + ' = ' + rupiah(sub)));

      const qty = el('div', P + 'qty');
      const dec = el('button', P + 'qty-btn', '\u2212');
      dec.type = 'button'; dec.dataset.action = 'dec'; dec.setAttribute('aria-label', 'Kurangi ' + it.name);
      const num = el('span', P + 'qty-num', String(it.qty));
      const inc = el('button', P + 'qty-btn', '+');
      inc.type = 'button'; inc.dataset.action = 'inc'; inc.setAttribute('aria-label', 'Tambah ' + it.name);
      qty.append(dec, num, inc);

      li.append(info, qty);
      list.appendChild(li);
    });

    $('#muadzmuttaqin_cart-empty').hidden = ids.length > 0;
    $('#muadzmuttaqin_cart-total').textContent = rupiah(total);
    $('#muadzmuttaqin_cart-checkout').disabled = ids.length === 0;
    $('#muadzmuttaqin_cart-clear').disabled = ids.length === 0;
  }

  function saveCart() {
    store.set(CART_KEY, cart);
    renderBadge();
    renderCart();
  }

  function changeQty(id, delta) {
    if (!cart[id]) return;
    cart[id].qty += delta;
    if (cart[id].qty <= 0) delete cart[id];
    if (cart[id] && cart[id].qty > 99) cart[id].qty = 99;
    saveCart();
  }

  function initCart() {
    renderBadge();
    // Sinkron antar tab: jika keranjang diubah di tab lain
    window.addEventListener('storage', e => {
      if (e.key === CART_KEY) { cart = loadCart(); renderBadge(); renderCart(); }
    });

    const list = $('#muadzmuttaqin_cart-list');
    if (!list) return;                                  // bagian di bawah hanya untuk menu.html
    renderCart();

    // Tombol "Tambah" pada kartu menu (data-item, data-name, data-price ada di elemen kartu)
    $$('.' + P + 'add-btn').forEach(btn => btn.addEventListener('click', () => {
      const card = btn.closest('.' + P + 'card3d');
      const id = card.dataset.item;
      if (!cart[id]) cart[id] = { name: card.dataset.name, price: Number(card.dataset.price), qty: 0 };
      cart[id].qty = Math.min(cart[id].qty + 1, 99);
      saveCart();
      showToast(card.dataset.name + ' ditambahkan ke keranjang');
    }));

    // Tombol tambah/kurang di dalam keranjang (event delegation)
    list.addEventListener('click', e => {
      const btn = e.target.closest('.' + P + 'qty-btn');
      if (!btn) return;
      changeQty(btn.closest('li').dataset.item, btn.dataset.action === 'inc' ? 1 : -1);
    });

    $('#muadzmuttaqin_cart-clear').addEventListener('click', () => {
      cart = {};
      saveCart();
      showToast('Keranjang dikosongkan');
    });
    $('#muadzmuttaqin_cart-checkout').addEventListener('click', () => {
      const total = Object.keys(cart).reduce((s, id) => s + cart[id].price * cart[id].qty, 0);
      cart = {};
      saveCart();
      showToast('Pesanan dicatat (simulasi). Total ' + rupiah(total) + '. Terima kasih!');
    });
  }


  /* ======================================================================
     13. VALIDASI FORM (reservasi dan kontak)
     Error tampil di bawah tiap field. Tanpa backend: jika valid, tampilkan toast
     lalu reset form.
     ====================================================================== */
  const NAME_RE = /^[\p{L}][\p{L}\s.'-]{2,}$/u;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^(?:\+62|62|0)8[1-9][0-9]{7,10}$/;          // nomor seluler Indonesia

  function setupForm(form, rules, onValid) {
    if (!form) return;
    const getInput = rule => document.getElementById(rule.id);

    function check(rule) {
      const input = getInput(rule);
      const message = rule.test(input.value.trim());
      const field = input.closest('.' + P + 'field');
      field.querySelector('.' + P + 'error').textContent = message;
      field.classList.toggle(P + 'invalid', Boolean(message));
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      return !message;
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      let firstInvalid = null;
      rules.forEach(rule => { if (!check(rule) && !firstInvalid) firstInvalid = getInput(rule); });
      if (firstInvalid) {
        firstInvalid.focus();
        showToast('Periksa kembali isian yang ditandai.', true);
        return;
      }
      onValid();
    });

    rules.forEach(rule => {
      const input = getInput(rule);
      input.addEventListener('blur', () => check(rule));
      input.addEventListener('input', () => {                // setelah error muncul, validasi langsung saat mengetik
        if (input.closest('.' + P + 'field').classList.contains(P + 'invalid')) check(rule);
      });
    });

    form.addEventListener('reset', () => {
      $$('.' + P + 'field', form).forEach(f => {
        f.classList.remove(P + 'invalid');
        f.querySelector('.' + P + 'error').textContent = '';
      });
    });
  }

  function todayISO(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + (offsetDays || 0));
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function initContactForm() {
    const form = $('#muadzmuttaqin_form-kontak');
    setupForm(form, [
      { id: 'muadzmuttaqin_kontak-nama', test: v => !v ? 'Nama wajib diisi.' : (!NAME_RE.test(v) ? 'Nama minimal 3 huruf dan hanya berisi huruf.' : '') },
      { id: 'muadzmuttaqin_kontak-email', test: v => !v ? 'Email wajib diisi.' : (!EMAIL_RE.test(v) ? 'Format email belum benar, contoh: nama@email.com.' : '') },
      { id: 'muadzmuttaqin_kontak-pesan', test: v => !v ? 'Pesan wajib diisi.' : (v.length < 10 ? 'Pesan minimal 10 karakter.' : (v.length > 500 ? 'Pesan maksimal 500 karakter.' : '')) }
    ], () => {
      showToast('Pesan terkirim. Terima kasih, kami akan membalas secepatnya.');
      form.reset();
    });
  }

  function initReservationForm() {
    const form = $('#muadzmuttaqin_form-reservasi');
    if (!form) return;
    const dateInput = $('#muadzmuttaqin_res-tanggal');
    dateInput.min = todayISO(0);
    dateInput.max = todayISO(90);

    setupForm(form, [
      { id: 'muadzmuttaqin_res-nama', test: v => !v ? 'Nama wajib diisi.' : (!NAME_RE.test(v) ? 'Nama minimal 3 huruf dan hanya berisi huruf.' : '') },
      { id: 'muadzmuttaqin_res-hp', test: v => {
        if (!v) return 'Nomor HP wajib diisi.';
        return PHONE_RE.test(v.replace(/[\s-]/g, '')) ? '' : 'Gunakan nomor seluler Indonesia, contoh: 0812 3456 7890.';
      } },
      { id: 'muadzmuttaqin_res-tanggal', test: v => {
        if (!v) return 'Pilih tanggal kedatangan.';
        if (v < todayISO(0)) return 'Tanggal tidak boleh sebelum hari ini.';
        if (v > todayISO(90)) return 'Reservasi dibuka maksimal 90 hari ke depan.';
        return '';
      } },
      { id: 'muadzmuttaqin_res-jam', test: v => {
        if (!v) return 'Pilih jam kedatangan.';
        if (dateInput.value === todayISO(0)) {                // hari ini: jam tidak boleh sudah lewat
          const d = new Date();
          const nowHM = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
          if (v <= nowHM) return 'Jam tersebut sudah lewat, pilih jam lain.';
        }
        return '';
      } },
      { id: 'muadzmuttaqin_res-tamu', test: v => {
        const n = Number(v);
        if (!v) return 'Jumlah tamu wajib diisi.';
        return Number.isInteger(n) && n >= 1 && n <= 20 ? '' : 'Jumlah tamu 1 sampai 20 orang. Untuk rombongan lebih besar, hubungi kami.';
      } },
      { id: 'muadzmuttaqin_res-catatan', test: v => v.length > 200 ? 'Catatan maksimal 200 karakter.' : '' }
    ], () => {
      // Ringkasan reservasi (diisi dengan textContent)
      const tgl = new Date(dateInput.value + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      const fill = (id, value) => { $('#muadzmuttaqin_sum-' + id).textContent = value; };
      fill('nama', $('#muadzmuttaqin_res-nama').value.trim());
      fill('hp', $('#muadzmuttaqin_res-hp').value.trim());
      fill('tanggal', tgl);
      fill('jam', $('#muadzmuttaqin_res-jam').value + ' WIB');
      fill('tamu', $('#muadzmuttaqin_res-tamu').value + ' orang');
      fill('catatan', $('#muadzmuttaqin_res-catatan').value.trim() || '-');
      const summary = $('#muadzmuttaqin_reservasi-summary');
      summary.hidden = false;
      summary.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });

      showToast('Reservasi tercatat (simulasi). Kami akan menghubungi Anda untuk konfirmasi.');
      form.reset();
    });
  }


  /* ======================================================================
     14. MASKOT ADZZ CHEF
     Spritesheet 8 frame (images/mascot/chef-welcome.png) diputar dengan mengganti
     background-position. Maskot menyapa otomatis saat halaman dibuka; klik maskot
     untuk melihatnya melambai lagi. Tombol x menyembunyikannya selama sesi browser.
     Jika pengguna memilih reduced-motion, animasi tidak diputar (hanya frame pertama).
     ====================================================================== */
  function initMascot() {
    const box = $('#muadzmuttaqin_mascot');
    if (!box) return;
    const KEY = 'muadzmuttaqin_mascot';
    try { if (sessionStorage.getItem(KEY) === 'off') { box.hidden = true; return; } } catch (e) { /* abaikan */ }

    const sprite = $('#muadzmuttaqin_mascot-sprite');
    const btn = $('#muadzmuttaqin_mascot-btn');
    const bubble = $('#muadzmuttaqin_mascot-bubble');
    const closeBtn = $('#muadzmuttaqin_mascot-close');
    const FRAMES = 8;           // jumlah frame pada spritesheet
    const STEP_MS = 110;        // jeda antar frame (ms)
    let timer = null;
    let bubbleTimer = null;

    // background-size 800% => frame ke-i berada di posisi i / (FRAMES - 1) * 100%
    const showFrame = i => { sprite.style.backgroundPosition = (i / (FRAMES - 1) * 100).toFixed(3) + '% 0'; };

    function stop() { clearInterval(timer); timer = null; showFrame(0); }
    function play(loops) {
      if (reduceMotion) return;
      stop();
      let frame = 0;
      let done = 0;
      timer = setInterval(() => {
        frame = (frame + 1) % FRAMES;
        showFrame(frame);
        if (frame === 0 && ++done >= loops) stop();
      }, STEP_MS);
    }

    function showBubble(autoHideMs) {
      bubble.classList.remove(P + 'fade');
      clearTimeout(bubbleTimer);
      if (autoHideMs) bubbleTimer = setTimeout(hideBubble, autoHideMs);
    }
    function hideBubble() { bubble.classList.add(P + 'fade'); }

    btn.addEventListener('click', () => {
      showBubble(9000);
      play(2);
    });
    closeBtn.addEventListener('click', () => {
      box.hidden = true;
      stop();
      try { sessionStorage.setItem(KEY, 'off'); } catch (e) { /* abaikan */ }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

    showFrame(0);
    showBubble(9000);
    setTimeout(() => play(3), 600);        // sapaan awal: melambai 3 kali
  }


  /* ======================================================================
     15. INISIALISASI
     Script dimuat di akhir <body>, jadi seluruh elemen sudah tersedia.
     ====================================================================== */
  initTheme();
  initChrome();
  initCart();
  initReveal();
  initHeroTilt();
  initMagnet();
  initCardTilt();
  initStack();
  initGallery();
  initSlider();
  initCharReveal();
  initMenuFilter();
  initContactForm();
  initReservationForm();
  initMascot();
})();
