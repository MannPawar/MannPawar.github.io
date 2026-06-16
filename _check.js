  document.body.classList.add('js');
  document.getElementById('yr').textContent = new Date().getFullYear();

  // nav border on scroll
  const navEl = document.querySelector('nav');
  addEventListener('scroll', () => navEl.classList.toggle('scrolled', scrollY > 8));

  // scroll-reveal cards
  const io = new IntersectionObserver((es) => {
    es.forEach((e, i) => { if (e.isIntersecting){ setTimeout(()=>e.target.classList.add('in'), i*90); io.unobserve(e.target); } });
  }, {threshold:.15});
  document.querySelectorAll('.card').forEach(c => io.observe(c));

  // project filtering
  const chips = document.querySelectorAll('.chip'), cards = document.querySelectorAll('.card');
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active')); chip.classList.add('active');
    const f = chip.dataset.f;
    cards.forEach(card => {
      const show = f === 'all' || card.dataset.cat === f;
      card.classList.toggle('hide', !show);
      if (show){ card.classList.remove('in'); requestAnimationFrame(()=>requestAnimationFrame(()=>card.classList.add('in'))); }
    });
  }));

  // lightbox
  const lb = document.getElementById('lb'), lbImg = document.getElementById('lb-img');
  document.querySelectorAll('.thumb[data-full]').forEach(t => t.addEventListener('click', () => {
    lbImg.src = t.dataset.full; lb.classList.add('open');
  }));
  lb.addEventListener('click', () => lb.classList.remove('open'));
  addEventListener('keydown', e => { if(e.key==='Escape') lb.classList.remove('open'); });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sci-fi light field (Destiny-inspired, original code/no game assets):
  // drifting golden light motes with bloom, slow orbiting geometric rings,
  // a cursor light, and a "transmat" ring burst on click.
  (function(){
    if (reduce) return;
    const cv = document.getElementById('fx'), cx = cv.getContext('2d');
    let W, H, dpr = Math.min(devicePixelRatio || 1, 2);
    const mouse = {x:-999, y:-999, on:false};
    const bursts = [];
    const trail = [];
    function resize(){ W = innerWidth; H = innerHeight;
      cv.width = W*dpr; cv.height = H*dpr; cx.setTransform(dpr,0,0,dpr,0,0); }
    resize(); addEventListener('resize', resize);
    addEventListener('pointermove', e => { mouse.x=e.clientX; mouse.y=e.clientY; mouse.on=true;
      trail.push({x:e.clientX, y:e.clientY, a:1}); if(trail.length>26) trail.shift(); });
    addEventListener('pointerleave', () => { mouse.on=false; });
    addEventListener('pointerdown', e => { bursts.push({x:e.clientX, y:e.clientY, r:0, a:1}); });

    // pre-rendered glow sprites = cheap bloom
    function glow(color, r){
      const s=document.createElement('canvas'); s.width=s.height=r*2;
      const g=s.getContext('2d'), grd=g.createRadialGradient(r,r,0,r,r,r);
      grd.addColorStop(0,color); grd.addColorStop(.2,color); grd.addColorStop(1,'transparent');
      g.fillStyle=grd; g.beginPath(); g.arc(r,r,r,0,7); g.fill(); return s;
    }
    const sprites=['rgba(255,205,120,1)','rgba(255,255,255,1)','rgba(120,200,255,1)','rgba(170,135,255,1)']
                  .map(c=>glow(c,30));

    const N = Math.min(130, Math.floor(W/11));
    const motes=[];
    for(let i=0;i<N;i++) motes.push({
      x:Math.random()*W, y:Math.random()*H,
      vx:(Math.random()-.5)*.14, vy:-(.08+Math.random()*.28),
      r:1+Math.random()*2.6, s:sprites[(Math.random()*sprites.length)|0],
      tw:Math.random()*6.28, tws:.012+Math.random()*.03
    });

    // slow-rotating wireframe shards (triangles + hexes)
    const shardCols=['rgba(120,200,255,.18)','rgba(170,135,255,.16)','rgba(255,205,120,.15)'];
    const shards=[];
    for(let i=0;i<7;i++) shards.push({
      x:Math.random()*W, y:Math.random()*H, r:14+Math.random()*26,
      sides:(Math.random()<.5?3:6), rot:Math.random()*6.28, vr:(Math.random()-.5)*.004,
      vx:(Math.random()-.5)*.10, vy:(Math.random()-.5)*.10, col:shardCols[i%3]
    });
    function drawShards(){
      for(const s of shards){
        s.x+=s.vx; s.y+=s.vy; s.rot+=s.vr;
        if(s.x<-50)s.x=W+50; if(s.x>W+50)s.x=-50; if(s.y<-50)s.y=H+50; if(s.y>H+50)s.y=-50;
        cx.strokeStyle=s.col; cx.lineWidth=1.2; cx.beginPath();
        for(let k=0;k<=s.sides;k++){ const a=s.rot+k*(6.283/s.sides);
          const px=s.x+Math.cos(a)*s.r, py=s.y+Math.sin(a)*s.r;
          k===0 ? cx.moveTo(px,py) : cx.lineTo(px,py); }
        cx.stroke();
      }
    }

    let t=0;
    function rings(){
      const ox=W*0.80, oy=H*0.32;
      const specs=[
        {r:115,seg:5,sp:.10,w:1.6,c:'rgba(255,205,120,.30)'},
        {r:165,seg:9,sp:-.07,w:1,c:'rgba(120,200,255,.20)'},
        {r:225,seg:3,sp:.05,w:2,c:'rgba(170,135,255,.16)'}
      ];
      for(const s of specs){
        const step=6.283/s.seg, base=t*s.sp*0.01;
        for(let k=0;k<s.seg;k++){
          const a0=base+k*step, a1=a0+step*0.55;
          cx.strokeStyle=s.c; cx.lineWidth=s.w;
          cx.beginPath(); cx.arc(ox,oy,s.r,a0,a1); cx.stroke();
        }
      }
    }

    function frame(){
      t++;
      cx.clearRect(0,0,W,H);
      cx.globalCompositeOperation='lighter';
      rings();
      drawShards();
      for(const m of motes){
        m.x+=m.vx; m.y+=m.vy; m.tw+=m.tws;
        if(mouse.on){ const dx=mouse.x-m.x, dy=mouse.y-m.y, d=Math.hypot(dx,dy);
          if(d<210){ m.vx+=dx/d*0.004; m.vy+=dy/d*0.004; } }
        m.vx*=0.994; if(m.vy<-0.7)m.vy=-0.7;
        if(m.y<-25){ m.y=H+25; m.x=Math.random()*W; m.vy=-(.08+Math.random()*.28); }
        if(m.x<-25)m.x=W+25; if(m.x>W+25)m.x=-25;
        const sz=m.r*7, a=0.5+0.5*Math.sin(m.tw);
        cx.globalAlpha=a*0.9; cx.drawImage(m.s, m.x-sz/2, m.y-sz/2, sz, sz);
      }
      if(mouse.on){ const sz=170; cx.globalAlpha=.22;
        cx.drawImage(sprites[0], mouse.x-sz/2, mouse.y-sz/2, sz, sz); }
      for(let i=0;i<trail.length;i++){ const p=trail[i]; p.a-=0.045; if(p.a<=0) continue;
        const sz=9+i*0.7; cx.globalAlpha=p.a*0.5;
        cx.drawImage(sprites[0], p.x-sz/2, p.y-sz/2, sz, sz); }
      for(let i=bursts.length-1;i>=0;i--){ const b=bursts[i];
        b.r+=6; b.a-=0.02;
        if(b.a<=0){ bursts.splice(i,1); continue; }
        cx.globalAlpha=b.a; cx.lineWidth=2; cx.strokeStyle='rgba(255,205,120,1)';
        cx.beginPath(); cx.arc(b.x,b.y,b.r,0,7); cx.stroke();
        cx.strokeStyle='rgba(120,200,255,.7)'; cx.beginPath(); cx.arc(b.x,b.y,b.r*0.6,0,7); cx.stroke();
      }
      cx.globalAlpha=1; cx.globalCompositeOperation='source-over';
      requestAnimationFrame(frame);
    }
    frame();
  })();

  // interactive cards: rarity accent + spotlight + sheen + 3D tilt
  const rarityCols = ['#ffcd78','#9b7cff','#78c8ff','#9b7cff'];
  document.querySelectorAll('.card').forEach((card, idx) => {
    const rar = document.createElement('div'); rar.className = 'rarity';
    rar.style.setProperty('--rc', rarityCols[idx % rarityCols.length]);
    const sheen = document.createElement('div'); sheen.className = 'sheen';
    const glow  = document.createElement('div'); glow.className  = 'glow';
    card.append(rar, sheen, glow);
    if (reduce) return;
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', (px*100) + '%');
      card.style.setProperty('--my', (py*100) + '%');
      card.classList.add('tilt');
      card.style.transform =
        'perspective(820px) rotateX(' + ((.5-py)*7) + 'deg) rotateY(' + ((px-.5)*7) + 'deg) translateY(-4px)';
    });
    card.addEventListener('pointerleave', () => { card.classList.remove('tilt'); card.style.transform = ''; });
  });

  // magnetic buttons: lean toward the cursor
  if (!reduce) document.querySelectorAll('.btn, .nav-cta').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((e.clientX-r.left-r.width/2)*0.22) + 'px,' +
                          ((e.clientY-r.top-r.height/2)*0.28 - 2) + 'px)';
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  // decode / scramble reveal on the hero highlight
  (function(){
    const el = document.querySelector('.hero h1 .grad');
    if (!el || reduce) return;
    const final = el.textContent, chars = 'ABCDEFGHJKLMNPQRZ0123456789#%&*<>/{}';
    let f = 0;
    const id = setInterval(() => {
      f++;
      el.textContent = final.split('').map((c, i) =>
        (c === ' ' || c === ',') ? c : (i < f/2 ? final[i] : chars[(Math.random()*chars.length)|0])
      ).join('');
      if (f/2 >= final.length) { el.textContent = final; clearInterval(id); }
    }, 38);
  })();
