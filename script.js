(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  if($('#year'))$('#year').textContent = new Date().getFullYear();

  // nav state + scroll progress
  const nav = $('#nav'), bar = $('#progress');
  const onScroll = () => {
    nav.classList.toggle('scrolled', scrollY > 20);
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // mobile menu
  const burger = $('#burger'), links = $('#links');
  const setMenu = open => {
    links.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  };
  burger.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  $$('a', links).forEach(a => a.addEventListener('click', () => setMenu(false)));

  // scroll reveal
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15 });
  $$('.reveal').forEach(el => io.observe(el));

  // material layers <-> photo highlight
  const photo = $('#photo');
  if (photo) $$('.layer').forEach(l => {
    const on = () => { $$('.layer').forEach(x => x.classList.remove('on')); l.classList.add('on'); photo.dataset.layer = l.dataset.i; };
    l.addEventListener('mouseenter', on);
    l.addEventListener('focus', on);
    l.addEventListener('click', on);
  });

  // gas-exchange particle animation
  const cv = $('#particles');
  if (cv) initParticles(cv);
  function initParticles(cv) {
  const ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const kinds = [
    { c: '#4a8fb5', up: false }, // O2 comes in
    { c: '#b9873c', up: true },  // CO2 goes out
    { c: '#5aa9a0', up: true }   // H2O vapour goes out
  ];
  let W, H, ps = [];
  const resize = () => {
    const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1;
    W = r.width; H = r.height;
    cv.width = W * d; cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  const spawn = (init) => {
    const k = kinds[Math.floor(Math.random() * kinds.length)];
    const x = W * (.12 + Math.random() * .76);
    return {
      k, x, r: 2.5 + Math.random() * 2.5,
      y: init ? Math.random() * H : (k.up ? H * .55 : H * .05),
      vy: (k.up ? -1 : 1) * (.25 + Math.random() * .35),
      ph: Math.random() * 6.28
    };
  };
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const film = H * .34;
    for (const p of ps) {
      p.y += p.vy; p.ph += .03;
      const px = p.x + Math.sin(p.ph) * 6;
      // slight slow-down while crossing the film
      if (Math.abs(p.y - film) < 8) p.y += p.vy * -.5;
      const out = p.y < -10 || p.y > H + 10;
      ctx.globalAlpha = .85;
      ctx.fillStyle = p.k.c;
      ctx.beginPath(); ctx.arc(px, p.y, p.r, 0, 6.283); ctx.fill();
      ctx.globalAlpha = .18;
      ctx.beginPath(); ctx.arc(px, p.y, p.r * 2.2, 0, 6.283); ctx.fill();
      if (out) Object.assign(p, spawn(false));
    }
    if (!reduce) requestAnimationFrame(draw);
  };
  resize();
  ps = Array.from({ length: 34 }, () => spawn(true));
  addEventListener('resize', () => { resize(); });
  draw();
  }

  // contact form: POST to AURESTEM_FORM_ENDPOINT if set (e.g. API Gateway/Lambda), else open a prefilled email
  const form = $('#contact-form');
  if (form) {
    const q = new URLSearchParams(location.search).get('industry');
    if (q) [...form.industry.options].forEach(o => { if (o.text === q) form.industry.value = o.value || o.text; });
    const msg = $('#form-msg');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      let ok = true;
      $$('[required]', form).forEach(f => { const bad = !f.value.trim() || !f.checkValidity(); f.classList.toggle('invalid', bad); if (bad) ok = false; });
      msg.className = 'form-msg';
      if (!ok) { msg.textContent = 'Please complete the highlighted fields.'; msg.classList.add('err'); return; }
      const d = Object.fromEntries(new FormData(form));
      if (d.hp) return;
      delete d.hp;
      const endpoint = window.AURESTEM_FORM_ENDPOINT;
      if (endpoint) {
        try {
          const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
          if (!r.ok) throw 0;
          form.reset(); msg.textContent = 'Thank you — we will be in touch shortly.'; msg.classList.add('ok');
        } catch { msg.textContent = 'Something went wrong. Please email sales@aurestem.com.'; msg.classList.add('err'); }
        return;
      }
      const body = Object.entries(d).filter(([, v]) => v).map(([k, v]) => k[0].toUpperCase() + k.slice(1) + ': ' + v).join('\n');
      location.href = 'mailto:sales@aurestem.com?subject=' + encodeURIComponent('Enquiry from ' + d.name + ' (' + d.company + ')') + '&body=' + encodeURIComponent(body);
      msg.textContent = 'Opening your email app… or write to sales@aurestem.com.'; msg.classList.add('ok');
    });
    $$('input,select,textarea', form).forEach(f => f.addEventListener('input', () => f.classList.remove('invalid')));
  }
})();
