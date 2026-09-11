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
  node.textContent = error?.message || 'কাজটি করা যায়নি। আবার চেষ্টা করুন।';
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
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 1000 / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
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
