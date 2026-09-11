const config = window.CAKE_FIREBASE_CONFIG;
firebase.initializeApp(config);
const auth = firebase.auth();
const db = firebase.firestore();
const loginView = document.querySelector('#login-view');
const dashboardView = document.querySelector('#dashboard-view');
const loginError = document.querySelector('#login-error');
const cakeError = document.querySelector('#cake-error');
const cakesRef = db.collection('cakes');

function showError(node, error) {
  const messages = {
    'permission-denied': 'আপনার admin login/session-এর অনুমতি নেই। Logout করে আবার login করুন।',
    'resource-exhausted': 'ছবিটি অনেক বড়। আরও ছোট ছবি দিয়ে আবার চেষ্টা করুন।',
    'unavailable': 'Firebase connection পাওয়া যায়নি। Internet check করে আবার চেষ্টা করুন।',
  };
  node.textContent = messages[error?.code] || error?.message || 'কাজটি করা যায়নি। আবার চেষ্টা করুন।';
}

auth.onAuthStateChanged((user) => {
  loginView.hidden = Boolean(user);
  dashboardView.hidden = !user;
  if (user) {
    document.querySelector('#admin-user').textContent = user.email;
    subscribeAdminCakes();
  }
});

document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';
  try {
    await auth.signInWithEmailAndPassword(
      document.querySelector('#login-email').value.trim(),
      document.querySelector('#login-password').value,
    );
  } catch (error) {
    showError(loginError, error);
  }
});

document.querySelector('#logout').addEventListener('click', () => auth.signOut());

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('ছবিটি নির্বাচন করুন।'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 600 / image.width, 600 / image.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('ছবিটি process করা যায়নি।'));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const maxBytes = 300 * 1024;
        for (const quality of [0.7, 0.58, 0.46, 0.34, 0.24]) {
          const compressed = canvas.toDataURL('image/jpeg', quality);
          const bytes = Math.ceil((compressed.length - compressed.split(',')[0].length - 1) * 3 / 4);
          if (bytes <= maxBytes) {
            resolve(compressed);
            return;
          }
        }
        reject(new Error('ছবিটি অনেক বড়। ছোট resolution-এর ছবি দিন।'));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.querySelector('#cake-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  cakeError.textContent = '';
  const submit = event.target.querySelector('button[type=submit]');
  submit.disabled = true;
  try {
    const image = await compressImage(document.querySelector('#cake-image').files[0]);
    await cakesRef.add({
      name: document.querySelector('#admin-name').value.trim(),
      details: document.querySelector('#admin-details').value.trim(),
      price: document.querySelector('#admin-price').value.trim(),
      image,
      featured: document.querySelector('#admin-featured').checked,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    event.target.reset();
  } catch (error) {
    showError(cakeError, error);
  } finally {
    submit.disabled = false;
  }
});

function subscribeAdminCakes() {
  cakesRef.orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
    const target = document.querySelector('#admin-cakes');
    target.innerHTML = snapshot.docs.map((doc) => {
      const cake = doc.data();
      return `<article class="admin-cake"><img src="${cake.image}" alt="${cake.name}" /><div><h3>${cake.name}</h3><p>${cake.details} · ${cake.price}</p></div><button type="button" data-delete="${doc.id}">Delete</button></article>`;
    }).join('') || '<p class="admin-sub">এখনো কোনো online cake নেই।</p>';
    target.querySelectorAll('[data-delete]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (window.confirm('এই cake delete করবেন?')) await cakesRef.doc(button.dataset.delete).delete();
      });
    });
  }, (error) => showError(cakeError, error));
}
