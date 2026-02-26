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

// Função de busca da página inicial
window.buscarHome = function() {
  // Captura os valores dos filtros
  const tipo = document.getElementById('tipo').value;
  const bairro = document.getElementById('bairro').value;
  const precoMin = document.getElementById('preco-min').value;
  const precoMax = document.getElementById('preco-max').value;
  const quartos = document.getElementById('quartos').value;

  // Monta a URL com os parâmetros
  const params = new URLSearchParams();
  if (tipo) params.append('type', tipo);
  if (bairro) params.append('bairro', bairro);
  if (precoMin) params.append('precoMin', precoMin);
  if (precoMax) params.append('precoMax', precoMax);
  if (quartos) params.append('quartos', quartos);

  // Redireciona para a página de listagem com os filtros
  window.location.href = 'listing.html?' + params.toString();
};

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

  // Se houver parâmetros na URL (vindo da home), preenche os filtros da listagem
  if (window.location.pathname.includes('listing.html')) {
    fillFiltersFromURL();
  }
});

function populateNeighborhoods() {
  const bairros = [...new Set(properties.map(p => p.neighborhood))];
  const selects = document.querySelectorAll('.bairro-select, #filter-bairro, #filter-bairro-mobile');
  selects.forEach(select => {
    // Limpa opções existentes (mantém a primeira "Todos")
    const defaultOption = select.querySelector('option[value=""]');
    select.innerHTML = '';
    if (defaultOption) select.appendChild(defaultOption.cloneNode(true));
    else {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Todos os bairros';
      select.appendChild(option);
    }
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
    bairroGrid.innerHTML = '';
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

// Preenche os filtros da listagem com base na URL
function fillFiltersFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Mapeia os parâmetros da URL para os IDs dos campos no formulário desktop e mobile
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
    { param: 'pet', desktop: 'filter-pet', mobile: 'filter-pet-mobile', isCheckbox: true }
  ];

  mappings.forEach(m => {
    const value = urlParams.get(m.param);
    if (value !== null) {
      // Preenche campo desktop
      const desktopField = document.getElementById(m.desktop);
      if (desktopField) {
        if (m.isCheckbox) {
          desktopField.checked = value === 'true' || value === 'on';
        } else {
          desktopField.value = value;
        }
      }
      // Preenche campo mobile
      const mobileField = document.getElementById(m.mobile);
      if (mobileField) {
        if (m.isCheckbox) {
          mobileField.checked = value === 'true' || value === 'on';
        } else {
          mobileField.value = value;
        }
      }
    }
  });

  // Após preencher, dispara o evento de submit para aplicar os filtros
  const filterForm = document.getElementById('filter-form');
  if (filterForm) {
    filterForm.dispatchEvent(new Event('submit'));
  }
}

// ---------- PÁGINA DE LISTAGEM ----------
function initListingPage() {
  let filteredProperties = [...properties];
  const container = document.getElementById('listing-container');
  const sortSelect = document.getElementById('sort');
  const filterForm = document.getElementById('filter-form');
  const filterFormMobile = document.getElementById('filter-form-mobile');
  const loadMoreBtn = document.getElementById('load-more');
  const resultCountSpan = document.getElementById('result-count');
  const itemsPerPage = 6;
  let currentPage = 1;

  // Função principal de filtragem e ordenação
  function applyFiltersAndSort() {
    // Captura valores dos filtros (desktop, mas pode usar os mesmos IDs)
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

    // Atualiza contador
    if (resultCountSpan) {
      resultCountSpan.textContent = filteredProperties.length;
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
    if (loadMoreBtn) {
      if (end >= filteredProperties.length) {
        loadMoreBtn.style.display = 'none';
      } else {
        loadMoreBtn.style.display = 'block';
      }
    }
  }

  // Event listener para o formulário desktop
  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      applyFiltersAndSort();
    });
  }

  // Event listener para o formulário mobile (se existir)
  if (filterFormMobile) {
    filterFormMobile.addEventListener('submit', (e) => {
      e.preventDefault();
      // Sincroniza os valores do mobile para os campos desktop antes de aplicar
      syncMobileToDesktop();
      applyFiltersAndSort();
      // Fecha o modal
      document.getElementById('modal-filters')?.classList.remove('active');
    });
  }

  // Sincroniza os filtros mobile para os campos desktop
  function syncMobileToDesktop() {
    const mobileFields = {
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
      'filter-pet-mobile': 'filter-pet'
    };

    for (let mobileId in mobileFields) {
      const mobileEl = document.getElementById(mobileId);
      const desktopEl = document.getElementById(mobileFields[mobileId]);
      if (mobileEl && desktopEl) {
        if (mobileEl.type === 'checkbox') {
          desktopEl.checked = mobileEl.checked;
        } else {
          desktopEl.value = mobileEl.value;
        }
      }
    }
  }

  // Sincroniza desktop para mobile (quando os filtros são alterados no desktop)
  function syncDesktopToMobile() {
    const desktopFields = {
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
      'filter-pet': 'filter-pet-mobile'
    };

    for (let desktopId in desktopFields) {
      const desktopEl = document.getElementById(desktopId);
      const mobileEl = document.getElementById(desktopFields[desktopId]);
      if (desktopEl && mobileEl) {
        if (desktopEl.type === 'checkbox') {
          mobileEl.checked = desktopEl.checked;
        } else {
          mobileEl.value = desktopEl.value;
        }
      }
    }
  }

  // Quando o sort mudar, reaplica
  if (sortSelect) {
    sortSelect.addEventListener('change', applyFiltersAndSort);
  }

  // Botão "Carregar mais"
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentPage++;
      renderPage();
    });
  }

  // Botão "Limpar todos" (desktop)
  const clearFiltersBtn = document.getElementById('clear-filters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      document.getElementById('filter-form').reset();
      syncDesktopToMobile(); // opcional
      applyFiltersAndSort();
    });
  }

  // Botão "Limpar" no mobile
  const clearMobileBtn = document.getElementById('clear-filters-mobile');
  if (clearMobileBtn) {
    clearMobileBtn.addEventListener('click', () => {
      document.getElementById('filter-form-mobile').reset();
      // Também limpa os campos desktop após sincronizar? Melhor sincronizar e aplicar
      syncMobileToDesktop();
      applyFiltersAndSort();
      document.getElementById('modal-filters')?.classList.remove('active');
    });
  }

  // Inicializa com os filtros atuais
  applyFiltersAndSort();

  // Sincroniza desktop -> mobile inicialmente
  syncDesktopToMobile();

  // Sempre que um filtro desktop mudar, sincronizar com mobile
  const desktopInputs = document.querySelectorAll('#filter-form select, #filter-form input');
  desktopInputs.forEach(input => {
    input.addEventListener('change', syncDesktopToMobile);
    input.addEventListener('input', syncDesktopToMobile);
  });
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
  tagsContainer.innerHTML = '';
  property.features.forEach(f => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = f;
    tagsContainer.appendChild(span);
  });

  // Galeria
  const mainImage = document.getElementById('main-image');
  const thumbContainer = document.getElementById('thumb-gallery');
  thumbContainer.innerHTML = '';
  mainImage.src = property.images[0];
  property.images.forEach((img, index) => {
    const thumb = document.createElement('img');
    thumb.src = img;
    thumb.addEventListener('click', () => {
      mainImage.src = img;
    });
    thumbContainer.appendChild(thumb);
  });

  // Mapa placeholder (substitua pela chave correta se necessário)
  document.getElementById('map-placeholder').innerHTML = '<iframe width="100%" height="300" frameborder="0" style="border:0" src="https://www.google.com/maps/embed/v1/place?key=AIzaSyAkmvI9DazzG9p77IShsz_Di7-5Qn7zkcg&q=brasil" allowfullscreen></iframe>';

  // Botões WhatsApp
  const visitBtn = document.getElementById('agendar-visita');
  if (visitBtn) {
    visitBtn.addEventListener('click', () => {
      const msg = `Olá, gostaria de agendar uma visita para o imóvel: ${property.title} (${formatPrice(property.price)}) - ${property.neighborhood}`;
      openWhatsApp('5511999999999', msg); // telefone fictício
    });
  }

  const infoBtn = document.getElementById('solicitar-info');
  if (infoBtn) {
    infoBtn.addEventListener('click', () => {
      const msg = `Olá, gostaria de mais informações sobre o imóvel: ${property.title}`;
      openWhatsApp('5511999999999', msg);
    });
  }

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