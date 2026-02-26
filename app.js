// app.js - Funções globais e utilitárias

let properties = []; // será preenchido via fetch
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Carrega dados do JSON
async function loadProperties() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    properties = data.properties;
    return properties;
  } catch (error) {
    console.error('Erro ao carregar imóveis:', error);
    return [];
  }
}

// Formata preço em reais
function formatPrice(price, type) {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Renderiza cards de imóveis (genérico)
function renderCards(containerId, propertiesArray, limit = 0) {
  const container = document.getElementById(containerId);
  if (!container) return;
  let html = '';
  const arr = limit > 0 ? propertiesArray.slice(0, limit) : propertiesArray;
  arr.forEach(prop => {
    const isFav = favorites.includes(prop.id);
    const badge = prop.featured ? '<span class="card-badge">Destaque</span>' : '';
    html += `
      <div class="card" data-id="${prop.id}">
        ${badge}
        <div class="card-favorite ${isFav ? 'favorito' : ''}" onclick="toggleFavorite(${prop.id}, this)">
          <i class="fa${isFav ? 's' : 'r'} fa-heart"></i>
        </div>
        <img src="${prop.images[0]}" alt="${prop.title}">
        <div class="card-content">
          <div class="card-price">${formatPrice(prop.price)}</div>
          <div class="card-neighborhood">${prop.neighborhood}</div>
          <div class="card-details">
            <span><i class="fas fa-ruler"></i> ${prop.area_m2}m²</span>
            <span><i class="fas fa-bed"></i> ${prop.bedrooms}</span>
            <span><i class="fas fa-car"></i> ${prop.parking}</span>
          </div>
          <a href="property.html?id=${prop.id}" class="btn" style="display: block; text-align: center;">Ver detalhes</a>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// Toggle favoritos
window.toggleFavorite = function(id, element) {
  const index = favorites.indexOf(id);
  if (index === -1) {
    favorites.push(id);
  } else {
    favorites.splice(index, 1);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  // Atualiza ícone
  if (element) {
    const icon = element.querySelector('i');
    if (favorites.includes(id)) {
      icon.classList.remove('far');
      icon.classList.add('fas');
      element.classList.add('favorito');
    } else {
      icon.classList.remove('fas');
      icon.classList.add('far');
      element.classList.remove('favorito');
    }
  }
};

// Abre WhatsApp com mensagem
function openWhatsApp(phone, message) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

// Botão flutuante WhatsApp (inserido em todas as páginas via HTML)
// Inicialização comum
document.addEventListener('DOMContentLoaded', async () => {
  await loadProperties();

  // Página de listagem
  if (document.getElementById('listing-container')) {
    initListingPage();
  }

  // Página de detalhes
  if (document.getElementById('property-detail')) {
    initPropertyPage();
  }

  // Página inicial (destaques)
  if (document.getElementById('featured-container')) {
    const featured = properties.filter(p => p.featured);
    renderCards('featured-container', featured, 6);
  }

  // Popula selects de bairro (listagem e home)
  populateNeighborhoods();
});

function populateNeighborhoods() {
  const bairros = [...new Set(properties.map(p => p.neighborhood))];
  const selects = document.querySelectorAll('.bairro-select');
  selects.forEach(select => {
    bairros.forEach(b => {
      const option = document.createElement('option');
      option.value = b;
      option.textContent = b;
      select.appendChild(option);
    });
  });

  // Bairros cards na home
  const bairroGrid = document.getElementById('bairros-grid');
  if (bairroGrid) {
    bairros.slice(0, 6).forEach(b => {
      const count = properties.filter(p => p.neighborhood === b).length;
      const card = document.createElement('div');
      card.className = 'bairro-card';
      card.innerHTML = `<h3>${b}</h3><p>${count} imóveis</p>`;
      card.addEventListener('click', () => {
        window.location.href = `listing.html?bairro=${encodeURIComponent(b)}`;
      });
      bairroGrid.appendChild(card);
    });
  }
}

// ---------- PÁGINA DE LISTAGEM ----------
function initListingPage() {
  let filteredProperties = [...properties];
  const container = document.getElementById('listing-container');
  const sortSelect = document.getElementById('sort');
  const filterForm = document.getElementById('filter-form');
  const loadMoreBtn = document.getElementById('load-more');
  const itemsPerPage = 6;
  let currentPage = 1;

  function applyFiltersAndSort() {
    // Filtros
    const tipo = document.getElementById('filter-tipo')?.value;
    const bairro = document.getElementById('filter-bairro')?.value;
    const precoMin = parseFloat(document.getElementById('filter-preco-min')?.value) || 0;
    const precoMax = parseFloat(document.getElementById('filter-preco-max')?.value) || Infinity;
    const quartos = parseInt(document.getElementById('filter-quartos')?.value) || 0;
    const banheiros = parseInt(document.getElementById('filter-banheiros')?.value) || 0;
    const vagas = parseInt(document.getElementById('filter-vagas')?.value) || 0;
    const areaMin = parseFloat(document.getElementById('filter-area-min')?.value) || 0;
    const areaMax = parseFloat(document.getElementById('filter-area-max')?.value) || Infinity;
    const mobiliado = document.getElementById('filter-mobiliado')?.checked;
    const varanda = document.getElementById('filter-varanda')?.checked;
    const pet = document.getElementById('filter-pet')?.checked;

    filteredProperties = properties.filter(p => {
      if (tipo && p.type !== tipo) return false;
      if (bairro && p.neighborhood !== bairro) return false;
      if (p.price < precoMin || p.price > precoMax) return false;
      if (p.bedrooms < quartos) return false;
      if (p.bathrooms < banheiros) return false;
      if (p.parking < vagas) return false;
      if (p.area_m2 < areaMin || p.area_m2 > areaMax) return false;
      if (mobiliado && !p.features.includes('mobiliado')) return false;
      if (varanda && !p.features.includes('varanda')) return false;
      if (pet && !p.features.includes('pet friendly')) return false;
      return true;
    });

    // Ordenação
    const sortBy = sortSelect?.value;
    if (sortBy === 'price-asc') {
      filteredProperties.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      filteredProperties.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'area-desc') {
      filteredProperties.sort((a, b) => b.area_m2 - a.area_m2);
    } else {
      // Mais recentes (data)
      filteredProperties.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    currentPage = 1;
    renderPage();
  }

  function renderPage() {
    const start = 0;
    const end = currentPage * itemsPerPage;
    const toShow = filteredProperties.slice(0, end);
    renderCards('listing-container', toShow);

    // Esconde botão se acabaram
    if (end >= filteredProperties.length) {
      loadMoreBtn.style.display = 'none';
    } else {
      loadMoreBtn.style.display = 'block';
    }
  }

  filterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFiltersAndSort();
  });

  sortSelect.addEventListener('change', applyFiltersAndSort);

  loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    renderPage();
  });

  // Filtro mobile
  const btnMobile = document.getElementById('btn-filters-mobile');
  const modal = document.getElementById('modal-filters');
  const closeModal = document.getElementById('close-modal');

  btnMobile.addEventListener('click', () => {
    modal.classList.add('active');
  });

  closeModal.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Inicial
  applyFiltersAndSort();
}

// ---------- PÁGINA DE DETALHES ----------
function initPropertyPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = parseInt(urlParams.get('id'));
  const property = properties.find(p => p.id === id);

  if (!property) {
    document.getElementById('property-detail').innerHTML = '<p>Imóvel não encontrado.</p>';
    return;
  }

  document.title = property.title + ' | Imobiliária Bairro Nobre';

  // Preencher dados
  document.getElementById('property-title').textContent = property.title;
  document.getElementById('property-price').innerHTML = `${formatPrice(property.price)} ${property.type === 'rent' ? '/mês' : ''}`;
  document.getElementById('property-condo').textContent = property.condo ? `Condomínio: ${formatPrice(property.condo)}` : '';
  document.getElementById('property-iptu').textContent = property.iptu ? `IPTU: ${formatPrice(property.iptu)}` : '';
  document.getElementById('property-neighborhood').textContent = property.neighborhood;
  document.getElementById('property-area').innerHTML = `<i class="fas fa-ruler"></i> ${property.area_m2}m²`;
  document.getElementById('property-bedrooms').innerHTML = `<i class="fas fa-bed"></i> ${property.bedrooms} quartos`;
  document.getElementById('property-bathrooms').innerHTML = `<i class="fas fa-bath"></i> ${property.bathrooms} banheiros`;
  document.getElementById('property-parking').innerHTML = `<i class="fas fa-car"></i> ${property.parking} vagas`;
  document.getElementById('property-description').textContent = property.description;

  // Tags
  const tagsContainer = document.getElementById('property-tags');
  property.features.forEach(f => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = f;
    tagsContainer.appendChild(span);
  });

  // Galeria
  const mainImage = document.getElementById('main-image');
  const thumbContainer = document.getElementById('thumb-gallery');
  mainImage.src = property.images[0];
  property.images.forEach((img, index) => {
    const thumb = document.createElement('img');
    thumb.src = img;
    thumb.addEventListener('click', () => {
      mainImage.src = img;
    });
    thumbContainer.appendChild(thumb);
  });

  // Mapa placeholder
  document.getElementById('map-placeholder').innerHTML = '<iframe width="100%" height="300" frameborder="0" style="border:0" src="https://www.google.com/maps/embed/v1/place?key=AIzaSyAkmvI9DazzG9p77IShsz_Di7-5Qn7zkcg&q=brasil" allowfullscreen></iframe>';

  // Botões WhatsApp
  const visitBtn = document.getElementById('agendar-visita');
  visitBtn.addEventListener('click', () => {
    const msg = `Olá, gostaria de agendar uma visita para o imóvel: ${property.title} (${formatPrice(property.price)}) - ${property.neighborhood}`;
    openWhatsApp('5511999999999', msg); // telefone fictício
  });

  const infoBtn = document.getElementById('solicitar-info');
  infoBtn.addEventListener('click', () => {
    const msg = `Olá, gostaria de mais informações sobre o imóvel: ${property.title}`;
    openWhatsApp('5511999999999', msg);
  });

  // Imóveis similares (mesmo bairro, excluindo ele mesmo)
  const similares = properties.filter(p => p.neighborhood === property.neighborhood && p.id !== property.id).slice(0, 3);
  renderCards('similares-container', similares);
}

// ---------- PÁGINA ANUNCIE ----------
if (document.getElementById('advertise-form')) {
  document.getElementById('advertise-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const tipo = document.getElementById('tipo-imovel').value;
    const bairro = document.getElementById('bairro').value;
    const valor = document.getElementById('valor').value;
    const msg = document.getElementById('mensagem').value;

    const texto = `Olá, gostaria de anunciar meu imóvel:%0A
Nome: ${nome}%0A
WhatsApp: ${whatsapp}%0A
Tipo: ${tipo}%0A
Bairro: ${bairro}%0A
Valor esperado: R$ ${valor}%0A
Mensagem: ${msg}`;
    openWhatsApp('5511999999999', texto);
  });
}

// ---------- PÁGINA CONTATO ----------
if (document.getElementById('contact-form')) {
  document.getElementById('contact-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('contact-nome').value;
    const email = document.getElementById('contact-email').value;
    const mensagem = document.getElementById('contact-mensagem').value;
    const texto = `Contato via site:%0ANome: ${nome}%0AE-mail: ${email}%0AMensagem: ${mensagem}`;
    openWhatsApp('5511999999999', texto);
  });
}


