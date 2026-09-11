const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const phoneNumber = '8801905180983';
const demoCakes = [
  { name: 'Berry Blush', details: 'Vanilla · fresh berries · cream', price: '৳ ১,২০০', image: 'https://images.unsplash.com/photo-1602351447937-745cb720612f?auto=format&fit=crop&w=800&q=85', featured: true },
  { name: 'Midnight Fudge', details: 'Dark chocolate · ganache · love', price: '৳ ১,৪০০', image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=800&q=85' },
  { name: 'Cloud Nine', details: 'Vanilla · cream cheese · sprinkles', price: '৳ ১,১০০', image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=800&q=85' },
];
const cakeGrid = document.querySelector('#cake-grid');
const storageKey = 'craft-cake-benapole-menu';
const cakeDialog = document.querySelector('#cake-dialog');
let liveCakes = null;

function getCakes() {
  if (liveCakes) return liveCakes;
  try { return JSON.parse(localStorage.getItem(storageKey)) || demoCakes; } catch { return demoCakes; }
}

function openCakeDetails(cake) {
  if (!cake || !cakeDialog) return;
  document.querySelector('#cake-detail-image').src = cake.image;
  document.querySelector('#cake-detail-image').alt = cake.name;
  document.querySelector('#cake-detail-name').textContent = cake.name;
  document.querySelector('#cake-detail-details').textContent = cake.details;
  document.querySelector('#cake-detail-price').textContent = `${cake.price} থেকে`;
  document.querySelector('#cake-detail-order').href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(`হ্যালো Samiya, আমি ${cake.name} cake order করতে চাই।`)}`;
  cakeDialog.showModal();
}

function renderCakes() {
  if (!cakeGrid) return;
  const cakes = getCakes();
  cakeGrid.innerHTML = cakes.map((cake, index) => `
    <article class="cake-card" tabindex="0" role="button" data-cake-index="${index}" aria-label="View ${cake.name}">
      <div class="cake-image">${cake.featured ? '<span class="tag">Bestseller</span>' : ''}<img src="${cake.image}" alt="${cake.name}" /></div>
      <div class="cake-meta"><div><h3>${cake.name}</h3><p>${cake.details}</p></div><strong>${cake.price}<small>from</small></strong></div>
    </article>
  `).join('');
  cakeGrid.querySelectorAll('[data-cake-index]').forEach((card) => {
    const open = () => openCakeDetails(getCakes()[Number(card.dataset.cakeIndex)]);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
    });
  });
}

toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? '×' : '☰';
});
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
  if (toggle) toggle.textContent = '☰';
}));

renderCakes();

if (window.firebase && window.CAKE_FIREBASE_CONFIG) {
  try {
    if (!firebase.apps.length) firebase.initializeApp(window.CAKE_FIREBASE_CONFIG);
    firebase.firestore().collection('cakes').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
      liveCakes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      if (liveCakes.length) renderCakes();
    });
  } catch (error) {
    console.warn('Live menu unavailable; using demo menu.', error);
  }
}

document.querySelector('#cake-dialog-close')?.addEventListener('click', () => cakeDialog?.close());
cakeDialog?.addEventListener('click', (event) => { if (event.target === cakeDialog) cakeDialog.close(); });

document.querySelector('#message-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.querySelector('#customer-name').value.trim();
  const message = document.querySelector('#customer-message').value.trim();
  window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(`হ্যালো Samiya, আমি ${name}। ${message}`)}`, '_blank', 'noopener,noreferrer');
});
