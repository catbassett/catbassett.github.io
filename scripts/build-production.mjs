import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { legacyCategories } from "../collection-preview/legacy-collections.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist-production");
const collectionRoot = path.join(root, "collection-preview");
const uploadRoot = path.join(collectionRoot, "assets", "images", "collections");
const trendImageRoot = path.join(collectionRoot, "assets", "images", "trend");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const collectionName = /^(\d{2,})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const galleryName = /^\d{2,}-.+\.(jpg|jpeg|png|webp)$/i;
const standardPages = ["about", "interiors", "athleisure", "graphics", "conversational", "kids"];

function fail(message) {
  throw new Error(`Production build error: ${message}`);
}

function titleFromSlug(slug) {
  return slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

async function directories(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function collectionData() {
  const categories = structuredClone(legacyCategories);

  for (const categorySlug of await directories(uploadRoot)) {
    const category = categories[categorySlug];
    if (!category) fail(`Unsupported collection category: ${categorySlug}.`);

    const usedOrders = new Set(category.collections.map((collection) => collection.order));
    const usedSlugs = new Set(category.collections.map((collection) => collection.slug));
    for (const folderName of await directories(path.join(uploadRoot, categorySlug))) {
      const match = folderName.match(collectionName);
      if (!match) fail(`Invalid collection folder: ${categorySlug}/${folderName}.`);
      const [, orderText, slug] = match;
      const order = Number(orderText);
      if (usedOrders.has(order) || usedSlugs.has(slug)) fail(`Duplicate collection order or URL: ${categorySlug}/${folderName}.`);

      const folder = path.join(uploadRoot, categorySlug, folderName);
      const files = (await readdir(folder, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name);
      const unsupported = files.filter((file) => file !== ".DS_Store" && !imageExtensions.has(path.extname(file).toLowerCase()));
      if (unsupported.length) fail(`Unsupported collection file(s): ${unsupported.join(", ")}.`);
      const cover = files.find((file) => /^cover\.(jpg|jpeg|png|webp)$/i.test(file));
      const hero = files.find((file) => /^hero\.(jpg|jpeg|png|webp)$/i.test(file));
      const images = files.filter((file) => galleryName.test(file)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      if (!cover || !images.length) fail(`Collection ${categorySlug}/${folderName} needs a cover and numbered gallery images.`);

      const imageBase = path.posix.join("assets", "images", "collections", categorySlug, folderName);
      category.collections.push({
        order,
        slug,
        title: titleFromSlug(slug),
        cover: path.posix.join(imageBase, cover),
        hero: path.posix.join(imageBase, hero || cover),
        images: images.map((file) => path.posix.join(imageBase, file))
      });
      usedOrders.add(order);
      usedSlugs.add(slug);
    }
  }

  return Object.fromEntries(Object.entries(categories).map(([slug, category]) => [slug, {
    slug,
    ...category,
    collections: category.collections.sort((a, b) => a.order - b.order)
  }]));
}

async function trendData() {
  const images = (await readdir(trendImageRoot, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (!images.length) fail("Trend needs rendered image pages.");
  return {
    slug: "trend",
    title: "Trend",
    season: "Summer 26/27",
    intro: "Seasonal womenswear direction spanning lace, bohemian craft, graphic surface, colour and silhouette research from Autumn/Winter 26 through to Spring/Summer 27.",
    heroImage: "assets/images/trend-summer2627.png",
    images: images.map((image) => path.posix.join("assets", "images", "trend", image))
  };
}

function appDocument({ title, page, category = "", collection = "", rootPrefix }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Cat Bassett Designs portfolio.">
  <title>${title}</title>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-5KB7TBEWGP"></script>
  <script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-5KB7TBEWGP');</script>
  <link rel="icon" href="${rootPrefix}favicon.ico">
  <link rel="stylesheet" href="${rootPrefix}app.css">
</head>
<body class="collection-preview" data-page="${page}" data-category="${category}" data-collection="${collection}" data-root-prefix="${rootPrefix}">
  <div class="page"></div>
  <script src="${rootPrefix}app-data.js"></script>
  <script src="${rootPrefix}app.js"></script>
</body>
</html>
`;
}

function standardDocument({ page, title }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${title} - Cat Bassett Designs.">
  <title>${title} - Cat Bassett Designs</title>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-5KB7TBEWGP"></script>
  <script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-5KB7TBEWGP');</script>
  <link rel="icon" href="../favicon.ico">
  <link rel="stylesheet" href="../site.css">
</head>
<body data-page="${page}" data-asset-root=".." data-site-root=".." data-preview-navigation="true">
  <div class="page"></div>
  <script src="../site.js"></script>
</body>
</html>
`;
}

function referencedAssets(...sources) {
  const assets = new Set();
  for (const source of sources) {
    for (const match of source.matchAll(/assets\/[^"'`<>\s]+/g)) assets.add(match[0]);
  }
  return assets;
}

async function copyFile(source, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination);
}

async function main() {
  const [categories, trend, siteSource, appSource, appStyle] = await Promise.all([
    collectionData(),
    trendData(),
    readFile(path.join(root, "site.js"), "utf8"),
    readFile(path.join(collectionRoot, "site.js"), "utf8"),
    readFile(path.join(collectionRoot, "site.css"), "utf8")
  ]);

  const finalSiteJs = siteSource.replaceAll("collection-preview/assets/images/", "assets/images/");
  const finalAppJs = appSource
    .replace('return rootUrl(joinPath("collection-preview", path));', "return rootUrl(path);")
    .replaceAll("collection-preview/assets/images/", "assets/images/");
  const finalAppCss = appStyle.replace('@import url("../site.css");', '@import url("site.css");');
  const dataSource = `window.collectionPreviewData = ${JSON.stringify({ categories, trend }, null, 2)};\n`;

  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await Promise.all([
    copyFile(path.join(root, "site.css"), path.join(output, "site.css")),
    writeFile(path.join(output, "site.js"), finalSiteJs),
    writeFile(path.join(output, "app.js"), finalAppJs),
    writeFile(path.join(output, "app.css"), finalAppCss),
    writeFile(path.join(output, "app-data.js"), dataSource),
    copyFile(path.join(root, "favicon.ico"), path.join(output, "favicon.ico")),
    copyFile(path.join(root, "CNAME"), path.join(output, "CNAME")),
    copyFile(path.join(root, ".nojekyll"), path.join(output, ".nojekyll"))
  ]);

  await writeFile(path.join(output, "index.html"), appDocument({ title: "Cat Bassett Designs", page: "home", rootPrefix: "" }));
  const trendOutput = path.join(output, "trend");
  await mkdir(trendOutput, { recursive: true });
  await writeFile(path.join(trendOutput, "index.html"), appDocument({ title: "Trend - Cat Bassett Designs", page: "trend", rootPrefix: "../" }));

  for (const category of Object.values(categories)) {
    const categoryOutput = path.join(output, category.slug);
    await mkdir(categoryOutput, { recursive: true });
    await writeFile(path.join(categoryOutput, "index.html"), appDocument({ title: `${category.title} - Cat Bassett Designs`, page: "category", category: category.slug, rootPrefix: "../" }));
    for (const collection of category.collections) {
      const collectionOutput = path.join(categoryOutput, collection.slug);
      await mkdir(collectionOutput, { recursive: true });
      await writeFile(path.join(collectionOutput, "index.html"), appDocument({ title: `${collection.title} - ${category.title} - Cat Bassett Designs`, page: "collection", category: category.slug, collection: collection.slug, rootPrefix: "../../" }));
    }
  }

  for (const page of standardPages) {
    const pageOutput = path.join(output, page);
    await mkdir(pageOutput, { recursive: true });
    const title = page === "about" ? "About" : page.charAt(0).toUpperCase() + page.slice(1);
    await writeFile(path.join(pageOutput, "index.html"), standardDocument({ page, title }));
  }

  const assets = referencedAssets(finalSiteJs, finalAppJs, dataSource);
  for (const asset of assets) {
    const previewAsset = asset.startsWith("assets/images/graphics.png") || asset.startsWith("assets/images/kids.png") || asset.startsWith("assets/images/trend-summer2627.png") || asset.startsWith("assets/images/trend/") || asset.startsWith("assets/images/collections/");
    const source = previewAsset ? path.join(collectionRoot, asset) : path.join(root, asset);
    await copyFile(source, path.join(output, asset));
  }

  console.log(`Built ${assets.size} referenced assets into ${path.relative(root, output)}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
