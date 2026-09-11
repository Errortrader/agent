const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const phoneNumber = '8801905180983';
const demoCakes = [
  { name: 'Berry Blush', details: 'Vanilla · fresh berries · cream', price: '৳ ১,২০০', image: 'https://images.unsplash.com/photo-1602351447937-745cb720612f?auto=format&fit=crop&w=800&q=85', featured: true },
  { name: 'Midnight Fudge', details: 'Dark chocolate · ganache · love', price: '৳ ১,৪০০', image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=800&q=85' },
  { name: 'Cloud Nine', details: 'Vanilla · cream cheese · sprinkles', price: '৳ ১,১০০', image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=800&q=85' },
];

const cakeGrid = document.querySelector('#cake-grid');
const dialog = document.querySelector('#manage-dialog');
const cakeForm = document.querySelector('#cake-form');
const imageInput = document.querySelector('#cake-image-input');
const savedCakes = document.querySelector('#saved-cakes');
const storageKey = 'craft-cake-benapole-menu';
let liveCakes = null;

function getCakes() {
  if (liveCakes) return liveCakes;
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || demoCakes;
  } catch {
    return demoCakes;
  }
}

function saveCakes(cakes) {
  localStorage.setItem(storageKey, JSON.stringify(cakes));
}

function renderCakes() {
  if (!cakeGrid) return;
  const cakes = getCakes();
  cakeGrid.innerHTML = cakes.map((cake) => `
    <article class="cake-card">
      <div class="cake-image">${cake.featured ? '<span class="tag">Bestseller</span>' : ''}<img src="${cake.image}" alt="${cake.name}" /></div>
      <div class="cake-meta"><div><h3>${cake.name}</h3><p>${cake.details}</p></div><strong>${cake.price}<small>from</small></strong></div>
    </article>
  `).join('');
  if (savedCakes) {
    savedCakes.innerHTML = cakes.map((cake, index) => `
      <div class="saved-item"><span>${cake.name} · ${cake.price}</span><button type="button" data-remove="${index}">Remove</button></div>
    `).join('');
    savedCakes.querySelectorAll('[data-remove]').forEach((button) => {
      button.addEventListener('click', () => {
        const next = getCakes();
        next.splice(Number(button.dataset.remove), 1);
        saveCakes(next);
        renderCakes();

        if (window.firebase && window.CAKE_FIREBASE_CONFIG) {
          try {
            firebase.initializeApp(window.CAKE_FIREBASE_CONFIG);
            firebase.firestore().collection('cakes').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
              liveCakes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
              if (liveCakes.length) renderCakes();
            });
          } catch (error) {
            console.warn('Live menu unavailable; using demo menu.', error);
          }
        }
      });
    });
  }
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(demoCakes[0].image);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? '×' : '☰';
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    if (toggle) toggle.textContent = '☰';
  });

  renderCakes();

  document.querySelector('.manage-trigger')?.addEventListener('click', () => {
    renderCakes();
    dialog?.showModal();
  });

  document.querySelector('.dialog-close')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  cakeForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const image = await readImage(imageInput.files[0]);
    const cakes = getCakes();
    cakes.push({
      name: document.querySelector('#cake-name').value.trim(),
      details: document.querySelector('#cake-details').value.trim(),
      price: document.querySelector('#cake-price').value.trim(),
      image,
      featured: document.querySelector('#cake-featured').checked,
    });
    saveCakes(cakes);
    cakeForm.reset();
    renderCakes();
    dialog.close();
  });

  document.querySelector('#reset-cakes')?.addEventListener('click', () => {
    saveCakes(demoCakes);
    renderCakes();
  });

  document.querySelector('#message-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.querySelector('#customer-name').value.trim();
    const message = document.querySelector('#customer-message').value.trim();
    const body = `হ্যালো Samiya, আমি ${name}। ${message}`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(body)}`, '_blank', 'noopener,noreferrer');
  });
});
