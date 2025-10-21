let webcamPlaneEl = null;
let nytArticles = [];

// === Fetch NYT Articles ===
async function fetchNYTArticles(keyword = 'surveillance') {
  const apiKey = "JFjJBC7AGXwfjBKCCR0EnpNPntdKPoYr";
  const url = `https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${encodeURIComponent(keyword)}&sort=newest&api-key=${apiKey}`;

  try {
    const resp = await fetch(url);
    const data = await resp.json();
    const docs = data.response?.docs || [];
    nytArticles = docs.map(doc => ({
      headline: doc.headline.main,
      abstract: doc.abstract || doc.lead_paragraph || 'No description available.',
      url: doc.web_url
    }));
    return nytArticles;
  } catch (err) {
    console.error('NYT fetch error:', err);
    return [];
  }
}



// === Hover Border for Images (no clipping) ===
AFRAME.registerComponent('hover-border', {
  init: function () {
    const el = this.el;
    const w = el.getAttribute('width');
    const h = el.getAttribute('height');
    let borderPlane;

    // Create the border plane once
    borderPlane = document.createElement('a-plane');
    borderPlane.setAttribute('width', w * 1.05);
    borderPlane.setAttribute('height', h * 1.05);
    borderPlane.setAttribute('color', 'white');
    borderPlane.setAttribute('shader', 'flat');
    borderPlane.setAttribute('visible', 'false');
    borderPlane.object3D.position.set(0, 0, -0.3); // moved further back
    el.appendChild(borderPlane);

    // Hover in/out handlers
    el.addEventListener('mouseenter', () => {
      borderPlane.setAttribute('visible', 'true');
    });

    el.addEventListener('mouseleave', () => {
      borderPlane.setAttribute('visible', 'false');
    });
  }
});


// === Sphere Component ===
AFRAME.registerComponent('image-sphere', {
  schema: {
    radius: { type: 'number', default: 20 },
    images: { type: 'array' }
  },
  async init() {
    const container = this.el;
    const { radius, images } = this.data;
    const cleanImages = images.map(i => i.trim());
    const articles = await fetchNYTArticles();
    const total = cleanImages.length;

    for (let i = 0; i < total; i++) {
      const y = 1 - (i / (total - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const phi = i * Math.PI * (3 - Math.sqrt(5));
      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;

      if (i === 16) {
        const plane = document.createElement('a-plane');
        plane.setAttribute('material', 'shader: standard; src: #webcamCanvas;');
        plane.setAttribute('width', 20);
        plane.setAttribute('height', 12);
        plane.setAttribute('position', `${x * radius} ${y * radius} ${z * radius}`);
        plane.setAttribute('look-at', '#camera');
        plane.setAttribute('class', 'clickable');
        plane.setAttribute('click-show-webcam', '');
        container.appendChild(plane);
        webcamPlaneEl = plane;
      } else {
        const img = document.createElement('a-image');
        img.setAttribute('src', cleanImages[i]);
        img.setAttribute('width', 20);
        img.setAttribute('height', 20);
        img.setAttribute('position', `${x * radius} ${y * radius} ${z * radius}`);
        img.setAttribute('look-at', '#camera');
        img.setAttribute('class', 'clickable');
        img.setAttribute('click-show-nyt', '');
        img.setAttribute('hover-border', '');

        let article = articles[i % articles.length] || {
          headline: "Surveillance and Society",
          abstract: "Article data unavailable. This is placeholder text for demo purposes.",
          url: "https://www.nytimes.com"
        };

        img.setAttribute('data-article', JSON.stringify(article));
        container.appendChild(img);
      }
    }
  }
});

// === Click Behavior for NYT Images ===
AFRAME.registerComponent('click-show-nyt', {
  init: function () {
    this.el.addEventListener('click', () => {
      const img = this.el;
      const attr = img.getAttribute('data-article');
      if (!attr) return;
      let article;
      try { article = JSON.parse(attr); } catch { return; }

      const imageOverlay = document.getElementById('image-overlay');
      const overlayImg = document.getElementById('overlay-img');
      const card = document.getElementById('article-card');

      overlayImg.src = img.getAttribute('src');
      imageOverlay.classList.add('show');
      card.classList.add('show');

      const cnt = card.querySelector('.content');
      cnt.innerHTML = `
        <h2>${article.headline}</h2>
        <p>${article.abstract}</p>
        <p><a href="${article.url}" target="_blank" style="color: red;">Read full article →</a></p>
      `;
    });
  }
});

// === Click Behavior for Webcam Plane ===
AFRAME.registerComponent('click-show-webcam', {
  init: function () {
    this.el.addEventListener('click', () => {
      const imageOverlay = document.getElementById('image-overlay');
      const overlayImg = document.getElementById('overlay-img');
      const card = document.getElementById('article-card');

      overlayImg.style.display = 'none';

      let liveCanvas = document.getElementById('overlay-webcam');
      if (!liveCanvas) {
        liveCanvas = document.createElement('canvas');
        liveCanvas.id = 'overlay-webcam';
        liveCanvas.style.maxWidth = '90%';
        liveCanvas.style.maxHeight = '90%';
        liveCanvas.style.border = '3px solid white';
        liveCanvas.style.borderRadius = '8px';
        liveCanvas.style.boxShadow = '0 0 20px rgba(255,255,255,0.3)';
        imageOverlay.appendChild(liveCanvas);
      }
      liveCanvas.style.display = 'block';

      imageOverlay.classList.add('show');
      card.classList.add('show');

      const firstName = localStorage.getItem('firstName') || 'Unknown';
      const lastName = localStorage.getItem('lastName') || '';
      const birthday = localStorage.getItem('birthdate') || 'N/A';
      const birthplace = localStorage.getItem('birthplace') || 'N/A';
      const fullName = `${firstName} ${lastName}`.trim();

      const cnt = card.querySelector('.content');
      cnt.innerHTML = `
        <h2>Name: ${fullName}</h2>
        <p><strong>Birthday:</strong> ${birthday}</p>
        <p><strong>Birthplace:</strong> Boston</p>
      `;

      const webcamCanvas = document.getElementById('webcamCanvas');
      const ctx = liveCanvas.getContext('2d');

      function drawOverlayFrame() {
        if (!imageOverlay.classList.contains('show')) return;
        if (webcamCanvas.width && webcamCanvas.height) {
          liveCanvas.width = webcamCanvas.width;
          liveCanvas.height = webcamCanvas.height;
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(webcamCanvas, -liveCanvas.width, 0, liveCanvas.width, liveCanvas.height);
          ctx.restore();
        }
        requestAnimationFrame(drawOverlayFrame);
      }
      drawOverlayFrame();
    });
  }
});

// === Webcam Setup ===
window.addEventListener('load', () => {
  const video = document.getElementById('webcam');
  const canvas = document.getElementById('webcamCanvas');
  if (!video || !canvas) return;
  const ctx = canvas.getContext('2d');

  navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 360 },
    audio: false
  })
  .then(stream => { video.srcObject = stream; })
  .catch(err => console.error('Webcam error:', err));

  video.addEventListener('loadedmetadata', () => {
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;

    setInterval(() => {
      ctx.filter = 'grayscale(100%)';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (webcamPlaneEl) {
        const mesh = webcamPlaneEl.getObject3D && webcamPlaneEl.getObject3D('mesh');
        if (mesh && mesh.material && mesh.material.map)
          mesh.material.map.needsUpdate = true;
      }
    }, 100);
  });
});

// === Close Overlays ===
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeOverlays();
});
window.addEventListener('click', e => {
  if (e.target.id === 'image-overlay' || e.target.id === 'article-card')
    closeOverlays();
});

function closeOverlays() {
  document.getElementById('image-overlay').classList.remove('show');
  document.getElementById('article-card').classList.remove('show');
  const liveCanvas = document.getElementById('overlay-webcam');
  if (liveCanvas) liveCanvas.style.display = 'none';
  document.getElementById('overlay-img').style.display = 'block';
}

// === Timestamp Update ===
window.addEventListener('DOMContentLoaded', () => {
  const t = document.getElementById('timestamp');
  const pad = n => String(n).padStart(2, '0');
  setInterval(() => {
    const now = new Date();
    t.textContent = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }, 1000);
});
