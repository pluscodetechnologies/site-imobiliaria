const PROPERTIES = [
{
id:1,
type:"sale",
title:"Apartamento com vista para o parque",
neighborhood:"Jardim Europa",
price:550000,
condo:800,
iptu:300,
area_m2:85,
bedrooms:3,
bathrooms:2,
parking:2,
features:["varanda","pet friendly","mobiliado"],
description:"Apartamento moderno, 3 dormitórios sendo 1 suíte, sala ampla, cozinha planejada, varanda com churrasqueira.",
images:[
"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
"https://images.unsplash.com/photo-1592947521997-4735c178d012",
"https://images.unsplash.com/photo-1484154218962-a197022b5858",
"https://images.unsplash.com/photo-1628592102751-ba83b0314276"
],
featured:true,
date:"2025-02-10"
},

{
id:2,
type:"rent",
title:"Cobertura duplex no Centro",
neighborhood:"Centro",
price:3500,
condo:500,
iptu:150,
area_m2:120,
bedrooms:4,
bathrooms:3,
parking:2,
features:["varanda","elevador"],
description:"Cobertura com 2 suítes, terraço, vista panorâmica.",
images:[
"https://images.unsplash.com/photo-1557306579-388e02baa1b6",
"https://images.unsplash.com/photo-1694290650842-12019fa9fbd7",
"https://images.unsplash.com/photo-1653203850510-67a3c4f927bd",
"https://images.unsplash.com/photo-1612320648993-61c1cd604b71"
],
featured:true,
date:"2025-02-05"
},

{
id:3,
type:"sale",
title:"Casa térrea com piscina",
neighborhood:"Alphaville",
price:890000,
condo:0,
iptu:400,
area_m2:200,
bedrooms:4,
bathrooms:3,
parking:3,
features:["piscina","pet friendly"],
description:"Casa ampla com piscina, churrasqueira, 4 suítes.",
images:[
"https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
"https://images.unsplash.com/photo-1613490493576-7fde63acd811",
"https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
"https://images.unsplash.com/photo-1707190205530-ca42118cb43f"
],
featured:true,
date:"2025-02-01"
},

{
id:4,
type:"rent",
title:"Kitnet mobiliada",
neighborhood:"Vila Nova",
price:1200,
condo:100,
iptu:50,
area_m2:30,
bedrooms:1,
bathrooms:1,
parking:0,
features:["mobiliado"],
description:"Kitnet com mobília nova, pronta para morar.",
images:[
"https://images.unsplash.com/photo-1592947521997-4735c178d012",
"https://images.unsplash.com/photo-1484154218962-a197022b5858",
"https://images.unsplash.com/photo-1628592102751-ba83b0314276"
],
featured:true,
date:"2025-02-12"
},

{
id:9,
type:"sale",
title:"Sobrado reformado",
neighborhood:"Moema",
price:750000,
condo:0,
iptu:350,
area_m2:150,
bedrooms:3,
bathrooms:2,
parking:2,
features:["pet friendly"],
description:"Sobrado com 3 dormitórios, 2 suítes, sala em dois ambientes.",
images:[
"https://images.unsplash.com/photo-1613490493576-7fde63acd811",
"https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
"https://images.unsplash.com/photo-1613575831056-0acd5da8f085"
],
featured:true,
date:"2025-02-09"
},

{
id:11,
type:"sale",
title:"Casa em condomínio",
neighborhood:"Alphaville",
price:1200000,
condo:800,
iptu:500,
area_m2:250,
bedrooms:5,
bathrooms:4,
parking:4,
features:["piscina","varanda"],
description:"Casa de alto padrão, 5 suítes, piscina e churrasqueira.",
images:[
"https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
"https://images.unsplash.com/photo-1707190205530-ca42118cb43f",
"https://images.unsplash.com/photo-1653203850510-67a3c4f927bd"
],
featured:true,
date:"2025-02-11"
}
];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let leafletMap = null;
let leafletMarker = null;
function formatPrice(price) {
  return Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function openWhatsApp(phone, message) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}
function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById(viewId);
  if (el) el.classList.add('active');
}
function parseRoute() {
  const raw = (window.location.hash || '').replace(/^#\/?/, '');
  if (!raw) return { route: 'home', params: new URLSearchParams() };
  const [routePart, queryPart] = raw.split('?');
  return {
    route: routePart || 'home',
    params: new URLSearchParams(queryPart || '')
  };
}
function setTitle(route) {
  const base = 'Imobiliária Bairro Nobre';
  const map = {
    home: base,
    listing: `Imóveis | Bairro Nobre`,
    property: `Detalhes do imóvel | Bairro Nobre`,
    advertise: `Anuncie seu imóvel | Bairro Nobre`,
    about: `Sobre nós | Bairro Nobre`,
    contact: `Contato | Bairro Nobre`
  };
  document.title = map[route] || base;
}
function renderCards(containerId, list, limit = 0) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const arr = limit > 0 ? list.slice(0, limit) : list;
  container.innerHTML = arr.map(prop => {
    const isFav = favorites.includes(prop.id);
    const badge = prop.featured ? '<span class="card-badge">Destaque</span>' : '';
    const typeSuffix = prop.type === 'rent' ? '<span class="card-price-suffix">/mês</span>' : '';
    return `
      <div class="card" data-id="${prop.id}">
        ${badge}
        <div class="card-favorite ${isFav ? 'favorito' : ''}" data-fav="${prop.id}">
          <i class="fa${isFav ? 's' : 'r'} fa-heart"></i>
        </div>
        <img src="${prop.images?.[0] || ''}" alt="${prop.title}">
        <div class="card-content">
          <div class="card-price">${formatPrice(prop.price)} ${typeSuffix}</div>
          <div class="card-neighborhood">${prop.neighborhood}</div>
          <div class="card-details">
            <span><i class="fas fa-ruler"></i> ${prop.area_m2}m²</span>
            <span><i class="fas fa-bed"></i> ${prop.bedrooms}</span>
            <span><i class="fas fa-car"></i> ${prop.parking}</span>
          </div>
          <a href="#/property?id=${prop.id}" class="btn" style="display:block; text-align:center;">Ver detalhes</a>
        </div>
      </div>
    `;
  }).join('');
  container.querySelectorAll('[data-fav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = Number(btn.getAttribute('data-fav'));
      toggleFavorite(id, btn);
    });
  });
}
function toggleFavorite(id, element) {
  const idx = favorites.indexOf(id);
  if (idx === -1) favorites.push(id);
  else favorites.splice(idx, 1);
  localStorage.setItem('favorites', JSON.stringify(favorites));
  if (element) {
    const icon = element.querySelector('i');
    const fav = favorites.includes(id);
    if (fav) {
      icon.classList.remove('far');
      icon.classList.add('fas');
      element.classList.add('favorito');
    } else {
      icon.classList.remove('fas');
      icon.classList.add('far');
      element.classList.remove('favorito');
    }
  }
}
window.buscarHome = function() {
  const tipo = document.getElementById('tipo')?.value || '';
  const bairro = document.getElementById('bairro')?.value || '';
  const precoMin = document.getElementById('preco-min')?.value || '';
  const precoMax = document.getElementById('preco-max')?.value || '';
  const quartos = document.getElementById('quartos')?.value || '';
  const params = new URLSearchParams();
  if (tipo) params.append('type', tipo);
  if (bairro) params.append('bairro', bairro);
  if (precoMin) params.append('precoMin', precoMin);
  if (precoMax) params.append('precoMax', precoMax);
  if (quartos) params.append('quartos', quartos);
  window.location.hash = '#/listing' + (params.toString() ? `?${params.toString()}` : '');
};
function populateNeighborhoods() {
  const bairros = [...new Set(PROPERTIES.map(p => p.neighborhood))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const selects = document.querySelectorAll('.bairro-select, #filter-bairro, #filter-bairro-mobile');
  selects.forEach(select => {
    if (!select) return;
    const first = select.querySelector('option[value=""]');
    select.innerHTML = '';
    if (first) select.appendChild(first.cloneNode(true));
    else {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Todos os bairros';
      select.appendChild(opt);
    }
    bairros.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b;
      opt.textContent = b;
      select.appendChild(opt);
    });
  });
  const grid = document.getElementById('bairros-grid');
  if (grid) {
    grid.innerHTML = '';
    bairros.slice(0, 6).forEach(b => {
      const count = PROPERTIES.filter(p => p.neighborhood === b).length;
      const card = document.createElement('div');
      card.className = 'bairro-card';
      card.innerHTML = `<h3>${b}</h3><p>${count} imóveis</p>`;
      card.addEventListener('click', () => {
        window.location.hash = `#/listing?bairro=${encodeURIComponent(b)}`;
      });
      grid.appendChild(card);
    });
  }
}
const Listing = (() => {
  let initialized = false;
  let filtered = [];
  const itemsPerPage = 6;
  let currentPage = 1;
  function getEls() {
    return {
      container: document.getElementById('listing-container'),
      sort: document.getElementById('sort'),
      form: document.getElementById('filter-form'),
      formMobile: document.getElementById('filter-form-mobile'),
      loadMore: document.getElementById('load-more'),
      resultCount: document.getElementById('result-count'),
      badgeCount: document.getElementById('active-filters-count'),
      modal: document.getElementById('modal-filters'),
      btnMobile: document.getElementById('btn-filters-mobile'),
      closeModal: document.getElementById('close-modal'),
      clearDesktop: document.getElementById('clear-filters'),
      clearMobile: document.getElementById('clear-filters-mobile'),
    };
  }
  function getDesktopFilters() {
    return {
      tipo: document.getElementById('filter-tipo')?.value || '',
      bairro: document.getElementById('filter-bairro')?.value || '',
      precoMin: parseFloat(document.getElementById('filter-preco-min')?.value) || 0,
      precoMax: parseFloat(document.getElementById('filter-preco-max')?.value) || Infinity,
      quartos: parseInt(document.getElementById('filter-quartos')?.value) || 0,
      banheiros: parseInt(document.getElementById('filter-banheiros')?.value) || 0,
      vagas: parseInt(document.getElementById('filter-vagas')?.value) || 0,
      areaMin: parseFloat(document.getElementById('filter-area-min')?.value) || 0,
      areaMax: parseFloat(document.getElementById('filter-area-max')?.value) || Infinity,
      mobiliado: !!document.getElementById('filter-mobiliado')?.checked,
      varanda: !!document.getElementById('filter-varanda')?.checked,
      pet: !!document.getElementById('filter-pet')?.checked,
    };
  }
  function syncMobileToDesktop() {
    const pairs = {
      'filter-tipo-mobile': 'filter-tipo',
      'filter-bairro-mobile': 'filter-bairro',
      'filter-preco-min-mobile': 'filter-preco-min',
      'filter-preco-max-mobile': 'filter-preco-max',
      'filter-quartos-mobile': 'filter-quartos',
      'filter-banheiros-mobile': 'filter-banheiros',
      'filter-vagas-mobile': 'filter-vagas',
      'filter-area-min-mobile': 'filter-area-min',
      'filter-area-max-mobile': 'filter-area-max',
      'filter-mobiliado-mobile': 'filter-mobiliado',
      'filter-varanda-mobile': 'filter-varanda',
      'filter-pet-mobile': 'filter-pet',
    };
    Object.entries(pairs).forEach(([m, d]) => {
      const mEl = document.getElementById(m);
      const dEl = document.getElementById(d);
      if (!mEl || !dEl) return;
      if (mEl.type === 'checkbox') dEl.checked = mEl.checked;
      else dEl.value = mEl.value;
    });
  }
  function syncDesktopToMobile() {
    const pairs = {
      'filter-tipo': 'filter-tipo-mobile',
      'filter-bairro': 'filter-bairro-mobile',
      'filter-preco-min': 'filter-preco-min-mobile',
      'filter-preco-max': 'filter-preco-max-mobile',
      'filter-quartos': 'filter-quartos-mobile',
      'filter-banheiros': 'filter-banheiros-mobile',
      'filter-vagas': 'filter-vagas-mobile',
      'filter-area-min': 'filter-area-min-mobile',
      'filter-area-max': 'filter-area-max-mobile',
      'filter-mobiliado': 'filter-mobiliado-mobile',
      'filter-varanda': 'filter-varanda-mobile',
      'filter-pet': 'filter-pet-mobile',
    };
    Object.entries(pairs).forEach(([d, m]) => {
      const dEl = document.getElementById(d);
      const mEl = document.getElementById(m);
      if (!dEl || !mEl) return;
      if (dEl.type === 'checkbox') mEl.checked = dEl.checked;
      else mEl.value = dEl.value;
    });
  }
  function updateActiveFilterCount() {
    const { badgeCount } = getEls();
    if (!badgeCount) return;
    const inputs = document.querySelectorAll('#filter-form select, #filter-form input[type="number"], #filter-form input[type="checkbox"]');
    let active = 0;
    inputs.forEach(i => {
      if (i.type === 'checkbox') { if (i.checked) active++; }
      else if (i.value && i.value !== '') active++;
    });
    badgeCount.textContent = String(active);
  }
  function applyFiltersAndSort() {
    const f = getDesktopFilters();
    const { sort } = getEls();
    filtered = PROPERTIES.filter(p => {
      if (f.tipo && p.type !== f.tipo) return false;
      if (f.bairro && p.neighborhood !== f.bairro) return false;
      if (p.price < f.precoMin || p.price > f.precoMax) return false;
      if (p.bedrooms < f.quartos) return false;
      if (p.bathrooms < f.banheiros) return false;
      if (p.parking < f.vagas) return false;
      if (p.area_m2 < f.areaMin || p.area_m2 > f.areaMax) return false;
      if (f.mobiliado && !p.features.includes('mobiliado')) return false;
      if (f.varanda && !p.features.includes('varanda')) return false;
      if (f.pet && !p.features.includes('pet friendly')) return false;
      return true;
    });
    const sortBy = sort?.value || 'recent';
    if (sortBy === 'price-asc') filtered.sort((a,b)=>a.price-b.price);
    else if (sortBy === 'price-desc') filtered.sort((a,b)=>b.price-a.price);
    else if (sortBy === 'area-desc') filtered.sort((a,b)=>b.area_m2-a.area_m2);
    else filtered.sort((a,b)=>new Date(b.date)-new Date(a.date));
    const { resultCount } = getEls();
    if (resultCount) resultCount.textContent = String(filtered.length);
    currentPage = 1;
    renderPage();
    updateActiveFilterCount();
  }
  function renderPage() {
    const end = currentPage * itemsPerPage;
    const toShow = filtered.slice(0, end);
    renderCards('listing-container', toShow);
    const { loadMore } = getEls();
    if (loadMore) {
      loadMore.style.display = end >= filtered.length ? 'none' : 'block';
    }
  }
  function fillFromParams(params) {
    const mappings = [
      { param: 'type', desktop: 'filter-tipo', mobile: 'filter-tipo-mobile' },
      { param: 'bairro', desktop: 'filter-bairro', mobile: 'filter-bairro-mobile' },
      { param: 'precoMin', desktop: 'filter-preco-min', mobile: 'filter-preco-min-mobile' },
      { param: 'precoMax', desktop: 'filter-preco-max', mobile: 'filter-preco-max-mobile' },
      { param: 'quartos', desktop: 'filter-quartos', mobile: 'filter-quartos-mobile' },
      { param: 'banheiros', desktop: 'filter-banheiros', mobile: 'filter-banheiros-mobile' },
      { param: 'vagas', desktop: 'filter-vagas', mobile: 'filter-vagas-mobile' },
      { param: 'areaMin', desktop: 'filter-area-min', mobile: 'filter-area-min-mobile' },
      { param: 'areaMax', desktop: 'filter-area-max', mobile: 'filter-area-max-mobile' },
      { param: 'mobiliado', desktop: 'filter-mobiliado', mobile: 'filter-mobiliado-mobile', isCheckbox: true },
      { param: 'varanda', desktop: 'filter-varanda', mobile: 'filter-varanda-mobile', isCheckbox: true },
      { param: 'pet', desktop: 'filter-pet', mobile: 'filter-pet-mobile', isCheckbox: true },
    ];
    mappings.forEach(m => {
      const v = params.get(m.param);
      if (v === null) return;
      const dEl = document.getElementById(m.desktop);
      const mEl = document.getElementById(m.mobile);
      if (dEl) {
        if (m.isCheckbox) dEl.checked = (v === 'true' || v === 'on' || v === '1');
        else dEl.value = v;
      }
      if (mEl) {
        if (m.isCheckbox) mEl.checked = (v === 'true' || v === 'on' || v === '1');
        else mEl.value = v;
      }
    });
  }
  function ensureInit() {
    if (initialized) return;
    initialized = true;
    const els = getEls();
    if (els.form) {
      els.form.addEventListener('submit', (e) => {
        e.preventDefault();
        applyFiltersAndSort();
      });
    }
    if (els.formMobile) {
      els.formMobile.addEventListener('submit', (e) => {
        e.preventDefault();
        syncMobileToDesktop();
        applyFiltersAndSort();
        els.modal?.classList.remove('active');
      });
    }
    els.sort?.addEventListener('change', applyFiltersAndSort);
    els.loadMore?.addEventListener('click', () => {
      currentPage++;
      renderPage();
    });
    els.clearDesktop?.addEventListener('click', () => {
      document.getElementById('filter-form')?.reset();
      syncDesktopToMobile();
      applyFiltersAndSort();
    });
    els.clearMobile?.addEventListener('click', () => {
      document.getElementById('filter-form-mobile')?.reset();
      syncMobileToDesktop();
      applyFiltersAndSort();
      els.modal?.classList.remove('active');
    });
    els.btnMobile?.addEventListener('click', () => els.modal?.classList.add('active'));
    els.closeModal?.addEventListener('click', () => els.modal?.classList.remove('active'));
    window.addEventListener('click', (e) => {
      if (e.target === els.modal) els.modal?.classList.remove('active');
    });
    const desktopInputs = document.querySelectorAll('#filter-form select, #filter-form input');
    desktopInputs.forEach(input => {
      input.addEventListener('change', () => { syncDesktopToMobile(); updateActiveFilterCount(); });
      input.addEventListener('input', () => { syncDesktopToMobile(); updateActiveFilterCount(); });
    });
  }
  function onEnter(params) {
    ensureInit();
    fillFromParams(params);
    syncDesktopToMobile();
    applyFiltersAndSort();
  }
  return { onEnter };
})();
function initMapForProperty(property) {
  const mapEl = document.getElementById('map');
  if (!mapEl || !window.L) return;
  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
    leafletMarker = null;
  }
  const lat = -23.5505;
  const lng = -46.6333;
  leafletMap = L.map('map').setView([lat, lng], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(leafletMap);
  leafletMarker = L.marker([lat, lng]).addTo(leafletMap)
    .bindPopup(property.neighborhood)
    .openPopup();
  setTimeout(() => leafletMap.invalidateSize(), 150);
}
function renderProperty(params) {
  const id = Number(params.get('id'));
  const property = PROPERTIES.find(p => p.id === id);
  if (!property) {
    document.getElementById('property-detail').innerHTML = '<p style="padding:2rem 0;">Imóvel não encontrado.</p>';
    return;
  }
  document.title = `${property.title} | Bairro Nobre`;
  document.getElementById('property-title').textContent = property.title;
  document.getElementById('property-price').innerHTML = `${formatPrice(property.price)}${property.type === 'rent' ? ' /mês' : ''}`;
  document.getElementById('property-condo').textContent = property.condo ? `Condomínio: ${formatPrice(property.condo)}` : '';
  document.getElementById('property-iptu').textContent = property.iptu ? `IPTU: ${formatPrice(property.iptu)}` : '';
  document.getElementById('property-neighborhood').textContent = property.neighborhood;
  document.querySelector('#property-area .feature-value').textContent = property.area_m2;
  document.querySelector('#property-bedrooms .feature-value').textContent = property.bedrooms;
  document.querySelector('#property-bathrooms .feature-value').textContent = property.bathrooms;
  document.querySelector('#property-parking .feature-value').textContent = property.parking;
  document.getElementById('property-description').textContent = property.description;
  const tags = document.getElementById('property-tags');
  tags.innerHTML = '';
  property.features.forEach(f => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = f;
    tags.appendChild(span);
  });
  const thumb = document.getElementById('thumb-gallery');
  const main = document.getElementById('main-image');
  thumb.innerHTML = '';
  main.src = property.images?.[0] || '';
  (property.images || []).forEach((src, idx) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Imagem ${idx+1}`;
    if (idx === 0) img.classList.add('active');
    img.addEventListener('click', () => {
      main.src = src;
      thumb.querySelectorAll('img').forEach(i => i.classList.remove('active'));
      img.classList.add('active');
    });
    thumb.appendChild(img);
  });
  const visitBtn = document.getElementById('agendar-visita');
  const infoBtn = document.getElementById('solicitar-info');
  visitBtn.onclick = () => {
    const msg = `Olá, gostaria de agendar uma visita para o imóvel: ${property.title} (${formatPrice(property.price)}) - ${property.neighborhood}`;
    openWhatsApp('5511999999999', msg);
  };
  infoBtn.onclick = () => {
    const msg = `Olá, gostaria de mais informações sobre o imóvel: ${property.title}`;
    openWhatsApp('5511999999999', msg);
  };
  const similares = PROPERTIES
    .filter(p => p.neighborhood === property.neighborhood && p.id !== property.id)
    .slice(0, 3);
  renderCards('similares-container', similares);
  initMapForProperty(property);
}
function ensureForms() {
  const advForm = document.getElementById('advertise-form');
  if (advForm && !advForm.dataset.bound) {
    advForm.dataset.bound = '1';
    advForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('nome')?.value || '';
      const whatsapp = document.getElementById('whatsapp')?.value || '';
      const tipo = document.getElementById('tipo-imovel')?.value || '';
      const bairro = document.getElementById('bairro-anunciar')?.value || '';
      const valor = document.getElementById('valor')?.value || '';
      const mensagem = document.getElementById('mensagem')?.value || '';
      const texto = `Olá, gostaria de anunciar meu imóvel:%0A
Nome: ${nome}%0A
WhatsApp: ${whatsapp}%0A
Tipo: ${tipo}%0A
Bairro: ${bairro}%0A
Valor esperado: R$ ${valor}%0A
Mensagem: ${mensagem || 'Não informada'}`;
      openWhatsApp('5511999999999', texto);
    });
  }
  const contactForm = document.getElementById('contact-form');
  if (contactForm && !contactForm.dataset.bound) {
    contactForm.dataset.bound = '1';
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('contact-nome')?.value || '';
      const email = document.getElementById('contact-email')?.value || '';
      const mensagem = document.getElementById('contact-mensagem')?.value || '';
      const texto = `Olá, gostaria de entrar em contato:%0ANome: ${nome}%0AE-mail: ${email}%0AMensagem: ${mensagem}`;
      openWhatsApp('5511999999999', texto);
    });
  }
}
function renderRoute() {
  const { route, params } = parseRoute();
  setTitle(route);
  if (route === 'home' || route === '') {
    showView('view-home');
    const featured = PROPERTIES.filter(p => p.featured);
    renderCards('featured-container', featured, 6);
    populateNeighborhoods();
    return;
  }
  if (route === 'listing') {
    showView('view-listing');
    Listing.onEnter(params);
    return;
  }
  if (route === 'property') {
    showView('view-property');
    renderProperty(params);
    return;
  }
  if (route === 'advertise') {
    showView('view-advertise');
    ensureForms();
    return;
  }
  if (route === 'about') {
    showView('view-about');
    return;
  }
  if (route === 'contact') {
    showView('view-contact');
    ensureForms();
    return;
  }
  showView('view-home');
}
document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.hash) window.location.hash = '#/home';
  populateNeighborhoods();
  ensureForms();
  renderRoute();
  window.addEventListener('hashchange', renderRoute);
});
