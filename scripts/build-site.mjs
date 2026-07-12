import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { legacyCategories } from "../collection-preview/legacy-collections.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const previewRoot = path.join(root, "collection-preview");
const uploadRoot = path.join(previewRoot, "assets", "images", "collections");
const trendImageRoot = path.join(previewRoot, "assets", "images", "trend");
const checkOnly = process.argv.includes("--check");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const collectionName = /^(\d{2,})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const galleryName = /^\d{2,}-.+\.(jpg|jpeg|png|webp)$/i;
const standardPreviewPages = ["about", "interiors", "athleisure", "graphics", "conversational", "kids"];

function fail(message) {
  throw new Error(`Collection build error: ${message}`);
}

function titleFromSlug(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function listDirectories(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function scanUploadedCollections() {
  const categories = structuredClone(legacyCategories);
  const categoryNames = await listDirectories(uploadRoot);

  for (const categorySlug of categoryNames) {
    const category = categories[categorySlug];
    if (!category) fail(`"${categorySlug}" is not a supported category. Use prints or embroideries.`);

    const categoryPath = path.join(uploadRoot, categorySlug);
    const folderNames = await listDirectories(categoryPath);
    const existingOrders = new Set(category.collections.map((collection) => collection.order));
    const existingSlugs = new Set(category.collections.map((collection) => collection.slug));

    for (const folderName of folderNames) {
      const match = folderName.match(collectionName);
      if (!match) fail(`"${categorySlug}/${folderName}" must look like "01-florals".`);

      const [, orderText, slug] = match;
      const order = Number(orderText);
      if (existingOrders.has(order)) fail(`"${categorySlug}/${folderName}" reuses display order ${orderText}.`);
      if (existingSlugs.has(slug)) fail(`"${categorySlug}/${folderName}" reuses the "${slug}" URL.`);

      const folderPath = path.join(categoryPath, folderName);
      const entries = await readdir(folderPath, { withFileTypes: true });
      const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
      const unsupported = files.filter((file) => file !== ".DS_Store" && !imageExtensions.has(path.extname(file).toLowerCase()));
      if (unsupported.length) fail(`"${categorySlug}/${folderName}" includes unsupported file(s): ${unsupported.join(", ")}.`);

      const cover = files.find((file) => /^cover\.(jpg|jpeg|png|webp)$/i.test(file));
      const hero = files.find((file) => /^hero\.(jpg|jpeg|png|webp)$/i.test(file));
      if (!cover) fail(`"${categorySlug}/${folderName}" needs a cover image named cover.jpg, cover.png, or cover.webp.`);

      const gallery = files.filter((file) => galleryName.test(file)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      if (!gallery.length) fail(`"${categorySlug}/${folderName}" needs at least one numbered gallery image such as 01-painting.jpg.`);

      const imageBase = path.posix.join("collection-preview", "assets", "images", "collections", categorySlug, folderName);
      category.collections.push({
        order,
        slug,
        title: titleFromSlug(slug),
        cover: path.posix.join(imageBase, cover),
        hero: path.posix.join(imageBase, hero || cover),
        images: gallery.map((file) => path.posix.join(imageBase, file))
      });
      existingOrders.add(order);
      existingSlugs.add(slug);
    }
  }

  return Object.fromEntries(
    Object.entries(categories).map(([slug, category]) => [
      slug,
      { slug, ...category, collections: category.collections.sort((a, b) => a.order - b.order) }
    ])
  );
}

async function scanTrendPages() {
  const entries = await readdir(trendImageRoot, { withFileTypes: true });
  const images = entries
    .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (!images.length) fail("Trend needs rendered PDF page images in collection-preview/assets/images/trend.");

  return {
    slug: "trend",
    title: "Trend",
    season: "Summer 26/27",
    intro: "Seasonal womenswear direction spanning lace, bohemian craft, graphic surface, colour and silhouette research from Autumn/Winter 26 through to Spring/Summer 27.",
    heroImage: "collection-preview/assets/images/trend-summer2627.png",
    images: images.map((image) => path.posix.join("collection-preview", "assets", "images", "trend", image))
  };
}

function pageDocument({ title, page, category = "", collection = "", rootPrefix }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Cat Bassett Designs collection navigation prototype.">
  <title>${title}</title>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-5KB7TBEWGP"></script>
  <script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-5KB7TBEWGP');</script>
  <link rel="icon" href="${rootPrefix}favicon.ico">
  <link rel="stylesheet" href="${rootPrefix}collection-preview/site.css">
</head>
<body class="collection-preview" data-page="${page}" data-category="${category}" data-collection="${collection}" data-root-prefix="${rootPrefix}">
  <div class="page"></div>
  <script src="${rootPrefix}collection-preview/data.js"></script>
  <script src="${rootPrefix}collection-preview/site.js"></script>
</body>
</html>
`;
}

function liveContentPreviewDocument({ page, title }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${title} - Cat Bassett Designs.">
  <title>${title} - Cat Bassett Designs</title>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-5KB7TBEWGP"></script>
  <script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-5KB7TBEWGP');</script>
  <link rel="icon" href="../../favicon.ico">
  <link rel="stylesheet" href="../../site.css">
</head>
<body data-page="${page}" data-asset-root="../.." data-site-root=".." data-preview-navigation="true">
  <div class="page"></div>
  <script src="../../site.js"></script>
</body>
</html>
`;
}

async function writePreview(categories, trend) {
  const previewOutput = path.join(output, "collection-preview");
  await mkdir(previewOutput, { recursive: true });
  await writeFile(path.join(previewOutput, "data.js"), `window.collectionPreviewData = ${JSON.stringify({ categories, trend }, null, 2)};\n`);
  await writeFile(path.join(previewOutput, "index.html"), pageDocument({ title: "Collection Preview - Cat Bassett Designs", page: "home", rootPrefix: "../" }));
  const trendOutput = path.join(previewOutput, "trend");
  await mkdir(trendOutput, { recursive: true });
  await writeFile(path.join(trendOutput, "index.html"), pageDocument({ title: "Trend - Cat Bassett Designs", page: "trend", rootPrefix: "../../" }));

  for (const category of Object.values(categories)) {
    const categoryOutput = path.join(previewOutput, category.slug);
    await mkdir(categoryOutput, { recursive: true });
    await writeFile(path.join(categoryOutput, "index.html"), pageDocument({ title: `${category.title} - Collection Preview`, page: "category", category: category.slug, rootPrefix: "../../" }));

    for (const collection of category.collections) {
      const collectionOutput = path.join(categoryOutput, collection.slug);
      await mkdir(collectionOutput, { recursive: true });
      await writeFile(path.join(collectionOutput, "index.html"), pageDocument({ title: `${collection.title} - ${category.title}`, page: "collection", category: category.slug, collection: collection.slug, rootPrefix: "../../../" }));
    }
  }

  for (const page of standardPreviewPages) {
    const pageOutput = path.join(previewOutput, page);
    await mkdir(pageOutput, { recursive: true });
    const title = page === "about" ? "About" : page.charAt(0).toUpperCase() + page.slice(1);
    await writeFile(path.join(pageOutput, "index.html"), liveContentPreviewDocument({ page, title }));
  }
}

async function copyProject() {
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  const excluded = new Set([".git", ".claude", "dist", "node_modules"]);
  const entries = await readdir(root, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => !excluded.has(entry.name))
      .map((entry) => cp(path.join(root, entry.name), path.join(output, entry.name), { recursive: true }))
  );
}

async function main() {
  const categories = await scanUploadedCollections();
  const trend = await scanTrendPages();
  if (checkOnly) {
    console.log("Collection folders are valid.");
    return;
  }
  await copyProject();
  await writePreview(categories, trend);
  console.log(`Built collection preview in ${path.relative(root, output)}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
