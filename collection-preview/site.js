const preview = window.collectionPreviewData;

const homePortfolioCards = [
  { slug: "trend", title: "Trend", description: "Seasonal womenswear direction, colour and graphic research.", image: "collection-preview/assets/images/trend-summer2627.png" },
  { slug: "prints", title: "Prints", description: "Painterly florals, decorative repeats and more elevated print collections.", image: "assets/images/2021/02/instagram-page.jpg" },
  { slug: "embroideries", title: "Embroideries", description: "Placement and motif-driven embroidery with a stronger luxury and craft sensibility.", image: "assets/images/2021/02/embroidery-web-page.png" },
  { slug: "interiors", title: "Interiors", description: "Print and artwork translated into more atmospheric, lifestyle-led interior settings.", image: "assets/images/2021/03/design-01ked4begc-1767820078.png" },
  { slug: "athleisure", title: "athleisure", description: "Application-led print development showing versatility across broader fashion categories.", image: "assets/images/2026/05/gemini_generated_image_5pl4md5pl4md5pl4.png" },
  { slug: "graphics", title: "Graphics", description: "Placement graphics and motifs developed with clarity, style and commercial polish.", image: "collection-preview/assets/images/graphics.png" },
  { slug: "conversational", title: "Conversational", description: "Illustrative and narrative surface design with personality, charm and repeat potential.", image: "assets/images/2022/10/printbird2.png" },
  { slug: "kids", title: "Kids", description: "Playful print and graphic work with warmth, clarity and strong seasonal storytelling.", image: "collection-preview/assets/images/kids.png" }
];

function joinPath(...parts) {
  return parts.filter(Boolean).join("/").replace(/([^:]\/)\/+/g, "$1");
}

function rootPrefix() {
  return document.body.dataset.rootPrefix;
}

function rootUrl(path) {
  return joinPath(rootPrefix(), path);
}

function previewUrl(path = "") {
  return rootUrl(joinPath("collection-preview", path));
}

function imageUrl(path) {
  return rootUrl(path);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pageFrame(activeCategory = "") {
  const categoryLinks = homePortfolioCards
    .map((category) => {
      const active = category.slug === activeCategory ? " is-active" : "";
      return `<a class="pill${active}" href="${previewUrl(`${category.slug}/index.html`)}">${escapeHtml(category.title)}</a>`;
    })
    .join("");
  const homeLink = `<a class="pill${activeCategory ? "" : " is-active"}" href="${previewUrl("index.html")}">Home</a>`;

  return `
    <header class="topbar">
      <div>
        <div class="eyebrow">Print &amp; Embroidery Design</div>
        <div class="brand-name">Cat Bassett Designs</div>
      </div>
      <div class="link-row">
        <a class="pill" href="${previewUrl("about/index.html")}">About</a>
      </div>
    </header>
    <nav class="subnav" aria-label="Portfolio categories">${homeLink}${categoryLinks}</nav>
  `;
}

function collectionCard(category, collection) {
  return `
    <a class="collection-card" href="${previewUrl(`${category.slug}/${collection.slug}/index.html`)}">
      <img src="${imageUrl(collection.cover)}" alt="${escapeHtml(collection.title)}">
      <div class="collection-card__copy">
        <div class="eyebrow">${escapeHtml(category.title)}</div>
        <h2>${escapeHtml(collection.title)}</h2>
      </div>
    </a>
  `;
}

function gallery(collection) {
  return `
    <div class="collection-gallery">
      ${collection.images
        .map(
          (image, index) => `
            <figure class="gallery-card">
              <button class="gallery-trigger" type="button" data-lightbox-src="${imageUrl(image)}" data-lightbox-alt="${escapeHtml(collection.title)} image ${index + 1}" aria-label="Open ${escapeHtml(collection.title)} image ${index + 1} larger">
                <img loading="lazy" src="${imageUrl(image)}" alt="${escapeHtml(collection.title)} image ${index + 1}">
              </button>
            </figure>
          `
        )
        .join("")}
    </div>
  `;
}

function lightbox() {
  return `
    <div class="lightbox" data-lightbox hidden>
      <button class="lightbox-backdrop" type="button" aria-label="Close large image view" data-lightbox-close></button>
      <div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="Large image view">
        <button class="lightbox-close" type="button" aria-label="Close large image view" data-lightbox-close>&times;</button>
        <img class="lightbox-image" src="" alt="" data-lightbox-image>
      </div>
    </div>
  `;
}

function footer() {
  return `<footer class="footer-row"><span>Cat Bassett Designs</span><span>London-based print and embroidery design</span></footer>`;
}

function portfolioCard(card) {
  return `
    <a class="portfolio-card" href="${previewUrl(`${card.slug}/index.html`)}">
      <img src="${imageUrl(card.image)}" alt="${escapeHtml(card.title)}">
      <div class="portfolio-copy">
        <div class="eyebrow">Collection</div>
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.description)}</p>
      </div>
    </a>
  `;
}

function renderHome() {
  document.title = "Cat Bassett Designs";
  document.querySelector(".page").innerHTML = `
    ${pageFrame()}
    <section class="hero-grid">
      <div class="hero-copy">
        <div class="eyebrow">Senior Print &amp; Embroidery Designer</div>
        <h1>Print and embroidery design shaped by studio craft and commercial clarity.</h1>
        <p>Senior Print &amp; Embroidery Designer with extensive experience across fashion textiles, placement graphics, all-over print, embroidery, CAD development and international studio leadership. Strong across trend research, commercial range building, buyer-facing presentations, factory liaison, strike-off management and mentoring junior designers.</p>
        <div class="hero-stats">
          <div class="stat"><strong>Central Saint Martins</strong><span>BA Printed Textile Design</span></div>
          <div class="stat"><strong>International</strong><span>UK, US, European and global market experience</span></div>
        </div>
      </div>
      <div class="hero-image"><img src="${imageUrl("assets/images/2021/02/my-photo-image.png")}" alt="Portrait of Cat Bassett"></div>
    </section>
    <section>
      <div class="section-head"><div><div class="eyebrow">Collections</div></div></div>
      <div class="portfolio-grid">
        ${homePortfolioCards.map(portfolioCard).join("")}
        <a class="portfolio-card" href="${previewUrl("about/index.html")}">
          <img src="${imageUrl("assets/images/2021/02/my-photo-image.png")}" alt="About">
          <div class="portfolio-copy"><div class="eyebrow">Contact</div><h3>About</h3><p>Background and contact details.</p></div>
        </a>
      </div>
    </section>
    <section>
      <div class="section-head"><div><div class="eyebrow">Profile - What Cat brings to a studio.</div></div></div>
      <div class="meta-grid">
        <div class="meta-card"><div class="eyebrow">Design Focus</div><h3>Print, embroidery and placement with range and depth.</h3><p>Strong across print, embroidery, placement graphics, all-over print, motif development, repeat design and commercial range building for fashion-led collections.</p></div>
        <div class="meta-card"><div class="eyebrow">Tools &amp; Process</div><h3>Handcrafted development backed by digital precision.</h3><p>Hand drawing, painting, mood boards, colour palettes, design packs and production-ready artwork sit alongside strong Adobe Illustrator and Photoshop skills, CAD development and a clear understanding of print and embroidery production processes.</p></div>
        <div class="meta-card"><div class="eyebrow">Studio Leadership</div><h3>Buyer-facing, team-led and factory-aware.</h3><p>Experienced in mentoring designers, presenting to buyers, training graduates, managing sampling and strike-offs, and keeping projects aligned to critical paths.</p></div>
      </div>
    </section>
    ${footer()}
  `;
}

function renderCategory(category) {
  document.title = `${category.title} - Collection Preview`;
  const page = category.page;
  document.querySelector(".page").innerHTML = `
    ${pageFrame(category.slug)}
    <section class="hero-grid">
      <div class="hero-copy">
        <div class="eyebrow">${escapeHtml(category.title)}</div>
        <h1>${escapeHtml(page.title)}</h1>
        <p>${escapeHtml(page.intro)}</p>
        <div class="hero-stats">${page.stats.map(([value, label]) => `<div class="stat"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join("")}</div>
      </div>
      <div class="hero-image"><img src="${imageUrl(page.heroImage)}" alt="${escapeHtml(category.title)}"><div class="hero-note">${escapeHtml(page.note)}</div></div>
    </section>
    <section>
      <div class="section-head"><div><div class="eyebrow">Overview</div><h2>A closer view of the work.</h2></div></div>
      <div class="meta-grid meta-grid--two">${page.cards.map((card) => `<div class="meta-card"><div class="eyebrow">${escapeHtml(card.eyebrow)}</div><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.text)}</p></div>`).join("")}</div>
    </section>
    <section>
      <div class="section-head"><div><div class="eyebrow">Collections</div></div></div>
      <div class="collection-grid">${category.collections.map((collection) => collectionCard(category, collection)).join("")}</div>
    </section>
    ${footer()}
  `;
}

function renderCollection(category, collection) {
  document.title = `${collection.title} - ${category.title} - Cat Bassett Designs`;
  document.querySelector(".page").innerHTML = `
    ${pageFrame(category.slug)}
    <div class="breadcrumb"><a href="${previewUrl(`${category.slug}/index.html`)}">${escapeHtml(category.title)}</a><span>/</span><span>${escapeHtml(collection.title)}</span></div>
    <section>
      ${gallery(collection)}
    </section>
    ${lightbox()}
    ${footer()}
  `;
}

function renderTrendPage() {
  const trend = preview.trend;
  document.title = `${trend.title} - Cat Bassett Designs`;
  document.querySelector(".page").innerHTML = `
    ${pageFrame("trend")}
    <section class="hero-grid">
      <div class="hero-copy"><div class="eyebrow">${escapeHtml(trend.title)}</div><h1>${escapeHtml(trend.season)}</h1><p>${escapeHtml(trend.intro)}</p></div>
      <div class="hero-image"><img src="${imageUrl(trend.heroImage)}" alt="${escapeHtml(trend.title)} ${escapeHtml(trend.season)}"></div>
    </section>
    <section>${gallery(trend)}</section>
    ${lightbox()}
    ${footer()}
  `;
}

function bindLightbox() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-lightbox-src]");
    const modal = document.querySelector("[data-lightbox]");
    const modalImage = document.querySelector("[data-lightbox-image]");
    if (trigger && modal && modalImage) {
      modalImage.src = trigger.dataset.lightboxSrc;
      modalImage.alt = trigger.dataset.lightboxAlt || "";
      modal.hidden = false;
      document.body.classList.add("lightbox-open");
    }
    if (event.target.closest("[data-lightbox-close]") && modal && modalImage) {
      modal.hidden = true;
      modalImage.src = "";
      document.body.classList.remove("lightbox-open");
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") document.querySelector("[data-lightbox-close]")?.click();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const { page, category: categorySlug, collection: collectionSlug } = document.body.dataset;
  const category = preview.categories[categorySlug];
  if (page === "home") renderHome();
  if (page === "trend") renderTrendPage();
  if (page === "category" && category) renderCategory(category);
  if (page === "collection" && category) {
    const collection = category.collections.find((item) => item.slug === collectionSlug);
    if (collection) renderCollection(category, collection);
  }
  bindLightbox();
});
