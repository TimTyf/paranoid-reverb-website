(() => {
  const d = window.PR_DATA || {};
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => [...c.querySelectorAll(s)];
  const ext = (href, label, cls='btn') => `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${label}</a>`;

  // Hero Vimeo panels: poster first, then progressive video loading.
  const heroFrames = $$('.hero-video-grid iframe');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loadFrame = (frame) => {
    if (!frame || frame.src || !frame.dataset.src) return;
    frame.addEventListener('load', () => frame.classList.add('is-loaded'), { once:true });
    frame.src = frame.dataset.src;
  };
  if (!reducedMotion && heroFrames.length) {
    const mobile = matchMedia('(max-width: 680px)').matches;
    const center = $('.hero-panel-center iframe') || heroFrames[0];
    requestAnimationFrame(() => loadFrame(center));
    if (!mobile) {
      const loadSides = () => heroFrames.filter(f => f !== center).forEach(loadFrame);
      if ('requestIdleCallback' in window) requestIdleCallback(loadSides, { timeout: 1400 });
      else setTimeout(loadSides, 850);
    }
  }

  // Release state switches automatically on release day.
  const releaseStatus = $('#release-status');
  if (releaseStatus && d.releaseDate) {
    const release = new Date(d.releaseDate);
    if (!Number.isNaN(release.getTime()) && Date.now() >= release.getTime()) releaseStatus.textContent = 'OUT NOW';
  }

  // Music / discography
  const albumCover = $('#carousel-cover');
  const albumTitle = $('#album-title');
  const albumKicker = $('#album-kicker');
  const albumSummary = $('#album-summary');
  const albumTracks = $('#carousel-tracklist');
  const albumLinks = $('#carousel-listen-links');
  const albumPosition = $('#album-position');
  const musicAtmosphere = $('#music-atmosphere');
  const albums = d.albums || [];
  let albumIndex = 0;

  const renderAlbum = (index, direction = 0) => {
    if (!albums.length) return;
    albumIndex = (index + albums.length) % albums.length;
    const album = albums[albumIndex];
    const carousel = $('#album-carousel');

    if (carousel) {
      carousel.classList.remove('album-changing');
      void carousel.offsetWidth;
      carousel.classList.add('album-changing');
      window.setTimeout(() => carousel.classList.remove('album-changing'), 650);
    }

    albumCover.src = album.cover;
    albumCover.alt = `${album.title} album cover`;
    albumTitle.textContent = album.title;
    albumKicker.textContent = albumIndex === albums.length - 1 ? `LATEST RELEASE / ${album.year}` : `${album.year} / ${album.type}`;
    albumSummary.textContent = album.summary || '';
    if (albumPosition) albumPosition.textContent = `${String(albumIndex + 1).padStart(2,'0')} / ${String(albums.length).padStart(2,'0')}`;

    if (musicAtmosphere) {
      musicAtmosphere.style.setProperty('--album-art', `url("${album.cover}")`);
      musicAtmosphere.classList.remove('is-changing');
      void musicAtmosphere.offsetWidth;
      musicAtmosphere.classList.add('is-changing');
    }

    albumTracks.innerHTML = (album.tracks || []).map((t,i)=>{
      const number = String(i+1).padStart(2,'0');
      if (!t[2]) return `<li><div class="track-row is-unavailable" aria-label="${t[0]} — streaming link coming soon"><span class="track-number">${number}</span><strong>${t[0]}</strong><span class="track-action">SOON</span><em>${t[1]}</em></div></li>`;
      return `<li><a class="track-row" href="${t[2]}" target="_blank" rel="noopener" aria-label="Listen to ${t[0]}"><span class="track-number">${number}</span><strong>${t[0]}</strong><span class="track-action">PLAY ↗</span><em>${t[1]}</em></a></li>`;
    }).join('');

    albumLinks.innerHTML = (album.listen || []).filter(x=>x[1]).map(([label,href])=>`<a href="${href}" target="_blank" rel="noopener"><span>${label}</span><em>↗</em></a>`).join('');
  };

  $('#album-prev')?.addEventListener('click',()=>renderAlbum(albumIndex-1,-1));
  $('#album-next')?.addEventListener('click',()=>renderAlbum(albumIndex+1,1));
  renderAlbum(Math.max(albums.length - 1, 0));

  // Lineup
  const lineup = $('#lineup');
  if (lineup) lineup.innerHTML = (d.lineup || []).map((m,i)=>`<div class="member"><span>${String(i+1).padStart(2,'0')}</span><strong>${m[0]}</strong><em>${m[1]}</em></div>`).join('');

  // Shows — data-driven live dates + archive
  const tour = $('#tour-list');
  const pastTour = $('#past-tour-list');
  const liveCount = $('#live-count');
  const pastCount = $('#past-count');
  const pastWrap = $('#past-shows-wrap');

  if (tour) {
    const now = new Date();
    now.setHours(0,0,0,0);
    const allShows = [...(d.shows || [])].sort((a,b) => new Date(a.date + 'T12:00:00') - new Date(b.date + 'T12:00:00'));
    const upcoming = allShows.filter(s => new Date(s.date + 'T23:59:59') >= now);
    const past = allShows.filter(s => new Date(s.date + 'T23:59:59') < now).reverse();

    const dateParts = (show) => {
      const dt = new Date(show.date + 'T12:00:00');
      if (Number.isNaN(dt.getTime())) return {day:'—', month:'', year:''};
      return {
        day: String(dt.getDate()).padStart(2,'0'),
        month: dt.toLocaleString('en-GB',{month:'short'}).toUpperCase(),
        year: String(dt.getFullYear())
      };
    };

    const actionMarkup = (show) => {
      if (show.status === 'soldout') return '<span class="show-status is-soldout">SOLD OUT</span>';
      if (show.status === 'free') return '<span class="show-status">FREE ENTRY</span>';
      if (show.tickets) return `<a class="show-link" href="${show.tickets}" target="_blank" rel="noopener">TICKETS <span>↗</span></a>`;
      if (show.event) return `<a class="show-link" href="${show.event}" target="_blank" rel="noopener">EVENT <span>↗</span></a>`;
      return `<span class="show-status">${show.statusLabel || 'INFO SOON'}</span>`;
    };

    const showMarkup = (show, isPast=false) => {
      const dp = dateParts(show);
      const location = [show.city, show.country].filter(Boolean).join(', ') || 'Details to be announced';
      const eventName = show.eventName ? `<span class="show-support show-event-name">${show.eventName}</span>` : '';
      const support = show.support ? `<span class="show-support">with ${show.support}</span>` : '';
      return `<article class="show reveal${isPast ? ' is-past' : ''}">
        <time class="show-date-block" datetime="${show.date}">
          <strong>${dp.day}</strong>
          <span>${dp.month}</span>
          <em>${dp.year}</em>
        </time>
        <div class="show-place">
          <strong>${show.venue || 'Venue TBA'}</strong>
          ${eventName}
          ${support}
        </div>
        <div class="show-location">${location}</div>
        <div class="show-actions">${isPast ? '<span class="show-status">PAST</span>' : actionMarkup(show)}</div>
      </article>`;
    };

    tour.innerHTML = upcoming.length
      ? upcoming.map(s => showMarkup(s)).join('')
      : '<div class="show show-empty"><div class="show-place"><strong>No dates announced</strong><span class="show-support">New live dates will appear here.</span></div></div>';

    if (liveCount) liveCount.textContent = `${String(upcoming.length).padStart(2,'0')} ${upcoming.length === 1 ? 'SHOW' : 'SHOWS'}`;

    if (pastTour && pastWrap) {
      if (past.length) {
        pastTour.innerHTML = past.map(s => showMarkup(s, true)).join('');
        pastWrap.hidden = false;
        if (pastCount) pastCount.textContent = String(past.length).padStart(2,'0');
      } else {
        pastWrap.hidden = true;
      }
    }
  }

  // Merch / Bandcamp gateway
  const merchGrid = $('#merch-grid');
  if (merchGrid) {
    merchGrid.innerHTML = (d.merch || []).map((item, i) => {
      const hasUrl = Boolean(item.url);
      const tag = hasUrl ? 'a' : 'article';
      const linkAttrs = hasUrl ? ` href="${item.url}" target="_blank" rel="noopener"` : '';
      const classes = ['merch-card', i === 0 ? 'is-store' : '', hasUrl ? '' : 'is-coming'].filter(Boolean).join(' ');
      const art = item.image ? `<div class="merch-card-art" aria-hidden="true"><img src="${item.image}" alt="" loading="lazy" decoding="async"></div>` : '';
      return `<${tag} class="${classes}"${linkAttrs}>${art}
        <div class="merch-card-top"><span class="merch-card-type">${item.type || ''}</span><span class="merch-card-index">${String(i+1).padStart(2,'0')}</span></div>
        <div class="merch-card-copy"><h3>${item.title || ''}</h3><p>${item.copy || ''}</p><div class="merch-card-action"><span>${item.label || (hasUrl ? 'OPEN BANDCAMP' : 'COMING SOON')}</span>${hasUrl ? '<em>↗</em>' : '<em></em>'}</div></div>
      </${tag}>`;
    }).join('');
  }

  // Contact email + follow/listen links
  const contactEmail = $('#contact-email-link');
  if (contactEmail && d.contactEmail) {
    contactEmail.href = `mailto:${d.contactEmail}`;
    const emailText = contactEmail.querySelector('span');
    if (emailText) emailText.textContent = d.contactEmail;
  }

  const social = $('#social-row');
  if (social) {
    const links = [
      ['Instagram', d.instagram],
      ['Spotify', d.spotifyArtist],
      ['Bandcamp', d.bandcampAlbum],
      ['YouTube', d.youtube],
      ['Apple Music', d.appleMusic],
      ['Facebook', d.facebook]
    ].filter(x => x[1]);
    social.innerHTML = links.map(([label,href]) => `<a href="${href}" target="_blank" rel="noopener"><span>${label}</span><em>↗</em></a>`).join('');
  }

  // Header / menu / progress
  const header = $('.site-header');
  const toggle = $('.menu-toggle');
  const nav = $('#site-nav');
  const onScroll = () => {
    header?.classList.toggle('scrolled', window.scrollY > 24);
    const h = document.documentElement.scrollHeight - innerHeight;
    const pct = h > 0 ? (scrollY / h) * 100 : 0;
    const bar = $('#page-progress-bar'); if (bar) bar.style.width = pct + '%';
  };
  addEventListener('scroll', onScroll, {passive:true}); onScroll();
  toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
  $$('#site-nav a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle?.setAttribute('aria-expanded','false');}));

  // Robust top navigation. #top previously lived on the fixed header,
  // which meant browsers could consider it already visible and not scroll.
  $$('a[href="#top"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + '#top');
  }));

  // Reveal
  const io = new IntersectionObserver(entries => entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12,rootMargin:'0px 0px -40px'});
  $$('.reveal').forEach(el=>io.observe(el));

  // Media gallery / lightbox
  const lightbox = $('#lightbox'), lightImg = $('#lightbox-image'), close = $('#lightbox-close');
  const lbPrev = $('#lightbox-prev'), lbNext = $('#lightbox-next'), lbCount = $('#lightbox-count'), lbCaption = $('#lightbox-caption');
  const mediaItems = $$('[data-lightbox]');
  let mediaIndex = 0;
  const renderMedia = (index) => {
    if (!mediaItems.length || !lightImg) return;
    mediaIndex = (index + mediaItems.length) % mediaItems.length;
    const btn = mediaItems[mediaIndex];
    const img = btn.querySelector('img');
    const label = btn.dataset.caption || img?.alt || '';
    lightImg.src = btn.dataset.lightbox;
    lightImg.alt = img?.alt || '';
    if (lbCaption) lbCaption.textContent = label;
    if (lbCount) lbCount.textContent = `${String(mediaIndex + 1).padStart(2,'0')} / ${String(mediaItems.length).padStart(2,'0')}`;
  };
  const openBox = (index) => {
    if (!lightbox) return;
    renderMedia(index);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    close?.focus();
  };
  const closeBox = () => {lightbox?.classList.remove('open');lightbox?.setAttribute('aria-hidden','true');document.body.style.overflow='';};
  mediaItems.forEach((btn,i) => btn.addEventListener('click',()=>openBox(i)));
  lbPrev?.addEventListener('click',e=>{e.stopPropagation();renderMedia(mediaIndex-1);});
  lbNext?.addEventListener('click',e=>{e.stopPropagation();renderMedia(mediaIndex+1);});
  close?.addEventListener('click',closeBox);
  lightbox?.addEventListener('click',e=>{if(e.target===lightbox)closeBox();});
  addEventListener('keydown',e=>{
    if (!lightbox?.classList.contains('open')) return;
    if(e.key==='Escape') closeBox();
    if(e.key==='ArrowLeft') renderMedia(mediaIndex-1);
    if(e.key==='ArrowRight') renderMedia(mediaIndex+1);
  });

  $('#year').textContent = new Date().getFullYear();
})();
