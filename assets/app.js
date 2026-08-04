(async () => {
  "use strict";

  const data = window.COURSE_DATA;
  if (!data) {
    document.body.innerHTML = '<main style="padding:2rem;font-family:sans-serif"><h1>Kursdaten fehlen</h1><p>Die Datei data/course-data.js konnte nicht geladen werden.</p></main>';
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const grid = $("#courseGrid");
  const nav = $("#sectionNav");
  const modal = $("#viewerModal");
  const viewerBody = $("#viewerBody");
  const viewerTitle = $("#viewerTitle");
  const viewerType = $("#viewerType");
  const openNewTab = $("#openNewTab");
  const downloadFile = $("#downloadFile");
  let lastFocused = null;

  document.title = `${data.course.title} · Kurs`;
  $("#courseTitle").textContent = data.course.title;
  $("#courseShortname").textContent = data.course.shortname || "Kurs";
  $("#courseCategory").textContent = data.course.category || "";

  const formatBytes = bytes => {
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
    return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
  };

  function countMaterials(items) {
    return (items || []).reduce((sum, item) => {
      if (item.type === "subsection" || item.type === "folder") return sum + countMaterials(item.items || []);
      return sum + 1;
    }, 0);
  }

  function iconFor(kind) {
    return ({ pdf: "PDF", html: "▶", image: "▧", video: "▶", audio: "♫", file: "↓", page: "≡", folder: "▤", link: "↗" })[kind] || "•";
  }

  function kindLabel(file) {
    return ({
      pdf: "PDF-Dokument",
      html: "HTML-Übung / Simulation",
      image: "Bild",
      video: "Video",
      audio: "Audio",
      file: "Download"
    })[file.kind] || file.mime || "Datei";
  }

  function createMaterial(item) {
    if (item.type === "subsection") return createSubsection(item);

    if (item.type === "folder") {
      const section = document.createElement("section");
      section.className = "subsection material-folder";
      section.dataset.search = `${item.title} ${collectSearch(item.items || [])}`.toLowerCase();
      const header = document.createElement("div");
      header.className = "material";
      header.innerHTML = `<span class="item-icon" aria-hidden="true">${iconFor("folder")}</span><span class="material-copy"><span class="material-title"></span><span class="material-meta"></span></span>`;
      $(".material-title", header).textContent = item.title;
      const count = countMaterials(item.items || []);
      $(".material-meta", header).textContent = `${count} Material${count === 1 ? "" : "ien"}`;
      section.append(header);
      const list = document.createElement("div");
      list.className = "folder-list";
      (item.items || []).forEach(child => list.append(createMaterial(child)));
      section.append(list);
      return section;
    }

    if (item.type === "link") {
      const link = document.createElement("a");
      link.className = "material external-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.dataset.search = `${item.title} ${item.description || ""} ${item.url}`.toLowerCase();
      link.innerHTML = `<span class="item-icon" aria-hidden="true">${iconFor("link")}</span><span class="material-copy"><span class="material-title"></span><span class="material-meta"></span></span><span class="material-action">Öffnen ↗</span>`;
      $(".material-title", link).textContent = item.title;
      $(".material-meta", link).textContent = item.description || item.url;
      return link;
    }

    if (item.type === "page") {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "material";
      button.dataset.search = `${item.title} ${stripHtml(item.html)}`.toLowerCase();
      button.innerHTML = `<span class="item-icon" aria-hidden="true">${iconFor("page")}</span><span class="material-copy"><span class="material-title"></span><span class="material-meta">Kursseite</span></span><span class="material-action">Öffnen</span>`;
      $(".material-title", button).textContent = item.title;
      button.addEventListener("click", () => openPage(item));
      return button;
    }

    if (item.type === "resource") return createFileButton(item.title, item.resource, item.intro);

    const unknown = document.createElement("div");
    unknown.className = "material empty-material";
    unknown.textContent = item.title || "Unbekanntes Material";
    return unknown;
  }

  function createFileButton(title, file, intro = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "material";
    button.dataset.search = `${title} ${file.filename || ""} ${stripHtml(intro)}`.toLowerCase();
    const meta = [kindLabel(file), formatBytes(file.size)].filter(Boolean).join(" · ");
    button.innerHTML = `<span class="item-icon" aria-hidden="true"></span><span class="material-copy"><span class="material-title"></span><span class="material-meta"></span></span><span class="material-action">Öffnen</span>`;
    $(".item-icon", button).textContent = iconFor(file.kind);
    $(".material-title", button).textContent = title;
    $(".material-meta", button).textContent = meta;
    button.addEventListener("click", () => openFile(title, file));
    return button;
  }

  function createSubsection(item) {
    const fragment = $("#subsectionTemplate").content.cloneNode(true);
    const section = $(".subsection", fragment);
    const toggle = $(".subsection-toggle", fragment);
    const body = $(".subsection-body", fragment);
    const title = $(".subsection-title", fragment);
    const meta = $(".subsection-meta", fragment);
    const summary = $(".subsection-summary", fragment);
    const items = $(".subsection-items", fragment);
    title.textContent = item.title;
    const count = countMaterials(item.items || []);
    meta.textContent = count ? `${count} Material${count === 1 ? "" : "ien"}` : "Noch ohne Inhalte";
    summary.innerHTML = item.summary || "";
    if (!item.summary) summary.remove();
    (item.items || []).forEach(child => items.append(createMaterial(child)));
    if (!(item.items || []).length) {
      const empty = document.createElement("div");
      empty.className = "material empty-material";
      empty.innerHTML = `<span class="item-icon" aria-hidden="true">·</span><span class="material-copy"><span class="material-title">Noch keine Materialien</span><span class="material-meta">Dateien einfach in den passenden Ordner unter materialien/ hochladen.</span></span>`;
      items.append(empty);
    }
    section.dataset.search = `${item.title} ${stripHtml(item.summary)} ${collectSearch(item.items || [])}`.toLowerCase();
    toggle.addEventListener("click", () => setExpanded(toggle, body, toggle.getAttribute("aria-expanded") !== "true"));
    return fragment;
  }

  function renderSection(sectionData) {
    const fragment = $("#sectionTemplate").content.cloneNode(true);
    const article = $(".section-card", fragment);
    const cover = $(".section-cover", fragment);
    const content = $(".section-content", fragment);
    const image = $(".cover-image", fragment);
    const summary = $(".section-summary", fragment);
    const items = $(".section-items", fragment);
    const count = countMaterials(sectionData.items || []);

    article.id = `section-${sectionData.id}`;
    article.dataset.search = `${sectionData.title} ${stripHtml(sectionData.summary)} ${collectSearch(sectionData.items || [])}`.toLowerCase();
    $(".section-number", fragment).textContent = Number(sectionData.number) === 0 ? "Start" : `Thema ${sectionData.number}`;
    $(".section-title", fragment).textContent = sectionData.title;
    $(".section-count", fragment).textContent = count ? `${count} Material${count === 1 ? "" : "ien"}` : "Noch ohne Materialien";
    if (sectionData.image) image.style.backgroundImage = `url(${JSON.stringify(browserPath(sectionData.image)).slice(1, -1)})`;
    else image.style.backgroundImage = "radial-gradient(circle at 75% 20%, rgba(255,255,255,.2), transparent 28%), linear-gradient(130deg,#246aa6,#123e65)";
    summary.innerHTML = sectionData.summary || "";
    if (!sectionData.summary) summary.remove();
    (sectionData.items || []).forEach(item => items.append(createMaterial(item)));
    if (!(sectionData.items || []).length) {
      const empty = document.createElement("div");
      empty.className = "material empty-material";
      empty.innerHTML = `<span class="item-icon" aria-hidden="true">·</span><span class="material-copy"><span class="material-title">Noch keine Materialien</span><span class="material-meta">Dateien einfach in den passenden Themenordner unter materialien/ hochladen.</span></span>`;
      items.append(empty);
    }
    cover.addEventListener("click", () => {
      const open = cover.getAttribute("aria-expanded") !== "true";
      setExpanded(cover, content, open);
      article.classList.toggle("open", open);
      if (open) history.replaceState(null, "", `#${article.id}`);
    });
    grid.append(fragment);

    const navButton = document.createElement("button");
    navButton.type = "button";
    navButton.className = "nav-link";
    navButton.innerHTML = `<span class="nav-number"></span><span class="nav-title"></span>`;
    $(".nav-number", navButton).textContent = Number(sectionData.number) === 0 ? "S" : sectionData.number;
    $(".nav-title", navButton).textContent = sectionData.title;
    navButton.addEventListener("click", () => {
      article.scrollIntoView({ behavior: "smooth", block: "start" });
      if (cover.getAttribute("aria-expanded") !== "true") cover.click();
      closeSidebar();
    });
    nav.append(navButton);
  }

  function setExpanded(button, panel, expanded) {
    button.setAttribute("aria-expanded", String(expanded));
    panel.hidden = !expanded;
  }

  function collectSearch(items) {
    return (items || []).map(item => {
      if (item.type === "subsection" || item.type === "folder") return `${item.title} ${collectSearch(item.items || [])}`;
      if (item.type === "resource") return `${item.title} ${item.resource?.filename || ""}`;
      if (item.type === "link") return `${item.title} ${item.description || ""} ${item.url || ""}`;
      return `${item.title || ""} ${stripHtml(item.html || "")}`;
    }).join(" ");
  }

  function stripHtml(value) {
    const temp = document.createElement("div");
    temp.innerHTML = value || "";
    return temp.textContent || "";
  }

  function openFile(title, file) {
    lastFocused = document.activeElement;
    viewerTitle.textContent = title;
    viewerType.textContent = kindLabel(file);
    const url = browserPath(file.path);
    openNewTab.href = url;
    openNewTab.hidden = false;
    downloadFile.href = url;
    downloadFile.download = file.filename || "";
    downloadFile.hidden = false;
    viewerBody.replaceChildren();

    if (["pdf", "html", "image"].includes(file.kind)) {
      const frame = document.createElement("iframe");
      frame.className = "viewer-frame";
      frame.title = title;
      frame.src = url;
      frame.allowFullscreen = true;
      if (file.kind === "html") {
        frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-presentation");
      }
      viewerBody.append(frame);
    } else if (file.kind === "video") {
      const video = document.createElement("video");
      video.className = "viewer-media";
      video.src = url;
      video.controls = true;
      video.playsInline = true;
      viewerBody.append(video);
    } else if (file.kind === "audio") {
      const audio = document.createElement("audio");
      audio.className = "viewer-audio";
      audio.src = url;
      audio.controls = true;
      viewerBody.append(audio);
    } else {
      const page = document.createElement("div");
      page.className = "page-view prose";
      page.innerHTML = `<h2>Datei herunterladen</h2><p>Dieser Dateityp wird nicht direkt im Browser angezeigt.</p><p><a class="button secondary" href="${url}" download>Download starten</a></p>`;
      viewerBody.append(page);
    }
    showModal();
    history.replaceState(null, "", `#material=${encodeURIComponent(file.path)}`);
  }

  function openPage(item) {
    lastFocused = document.activeElement;
    viewerTitle.textContent = item.title;
    viewerType.textContent = "Kursseite";
    openNewTab.hidden = true;
    downloadFile.hidden = true;
    viewerBody.replaceChildren();
    const page = document.createElement("article");
    page.className = "page-view prose";
    page.innerHTML = item.html || "<p>Diese Seite enthält keinen Inhalt.</p>";
    viewerBody.append(page);
    showModal();
  }

  function showModal() {
    modal.hidden = false;
    document.body.classList.add("modal-open");
    $("[data-close-modal]", modal).focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    viewerBody.replaceChildren();
    document.body.classList.remove("modal-open");
    if (location.hash.startsWith("#material=")) history.replaceState(null, "", location.pathname + location.search);
    lastFocused?.focus();
  }

  $$('[data-close-modal]').forEach(el => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeModal();
      closeSidebar();
    }
  });

  function normalizePath(value) {
    return String(value || "")
      .replace(/\\/g, "/")
      .replace(/^\.\//, "")
      .replace(/^\//, "")
      .replace(/\/{2,}/g, "/");
  }

  function directoryName(path) {
    const normalized = normalizePath(path);
    const slash = normalized.lastIndexOf("/");
    return slash === -1 ? "" : normalized.slice(0, slash);
  }

  function browserPath(path) {
    return normalizePath(path).split("/").map(segment => encodeURIComponent(segment)).join("/");
  }

  function fileKind(filename, mime = "") {
    const extension = filename.toLowerCase().split(".").pop();
    if (mime === "application/pdf" || extension === "pdf") return "pdf";
    if (mime === "text/html" || ["html", "htm"].includes(extension)) return "html";
    if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"].includes(extension)) return "image";
    if (mime.startsWith("video/") || ["mp4", "webm", "ogv", "mov", "m4v"].includes(extension)) return "video";
    if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac"].includes(extension)) return "audio";
    return "file";
  }

  function inferredMime(filename) {
    const extension = filename.toLowerCase().split(".").pop();
    return ({
      pdf: "application/pdf", html: "text/html", htm: "text/html",
      png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", avif: "image/avif",
      mp4: "video/mp4", webm: "video/webm", ogv: "video/ogg", mov: "video/quicktime", m4v: "video/x-m4v",
      mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", m4a: "audio/mp4", aac: "audio/aac",
      txt: "text/plain", csv: "text/csv", zip: "application/zip", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    })[extension] || "application/octet-stream";
  }

  function manifestFile(entry) {
    const path = normalizePath(entry.path);
    const filename = String(entry.filename || path.split("/").pop() || "Datei");
    const mime = String(entry.mime || inferredMime(filename));
    return { filename, path, mime, size: Number(entry.size) || 0, kind: fileKind(filename, mime) };
  }

  async function fetchFileManifest(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    const manifest = await response.json();
    if (!Array.isArray(manifest)) throw new Error(`${url}: ungültiges Format`);
    return manifest;
  }

  async function loadMaterialManifest() {
    for (const url of ["data/material-files-auto.json", "data/material-files.json"]) {
      try {
        const manifest = await fetchFileManifest(url);
        if (manifest.length) return manifest;
      } catch (error) {
        console.info(`Dateiliste ${url} konnte nicht verwendet werden.`, error);
      }
    }
    return [];
  }

  function parseFolderLabel(segment) {
    let decoded = segment;
    try { decoded = decodeURIComponent(segment); } catch (_) { /* unverändert */ }
    const match = decoded.match(/^\s*(\d+)\s*(?:[._-]\s*)?(.+?)\s*$/);
    const order = match ? Number(match[1]) : null;
    const title = (match ? match[2] : decoded).replace(/_/g, " ").trim();
    return { order, title: title || decoded };
  }

  function normalizeTitle(value) {
    return String(value || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, "und")
      .replace(/[^a-z0-9]+/gi, "")
      .toLowerCase();
  }

  function slug(value) {
    return normalizeTitle(value) || `bereich-${Date.now()}`;
  }

  function fileTitle(filename) {
    const withoutExtension = filename.replace(/\.[^.]+$/, "");
    return withoutExtension.replace(/_/g, " ").trim() || filename;
  }

  function ensureSection(segment) {
    const parsed = parseFolderLabel(segment);
    let section = parsed.order !== null ? data.sections.find(entry => Number(entry.number) === parsed.order) : null;
    if (!section) section = data.sections.find(entry => normalizeTitle(entry.title) === normalizeTitle(parsed.title));
    if (section) return section;

    const nextNumber = parsed.order ?? (Math.max(0, ...data.sections.map(entry => Number(entry.number) || 0)) + 1);
    section = {
      id: `auto-${slug(parsed.title)}`,
      number: nextNumber,
      title: parsed.title,
      summary: "",
      image: "",
      items: [],
      empty: true,
      autoCreated: true
    };
    data.sections.push(section);
    return section;
  }

  function ensureSubsection(section, segment) {
    const parsed = parseFolderLabel(segment);
    const subsections = (section.items || []).filter(item => item.type === "subsection");
    let subsection = parsed.order ? subsections[parsed.order - 1] : null;
    if (!subsection) subsection = subsections.find(item => normalizeTitle(item.title) === normalizeTitle(parsed.title));
    if (subsection) return subsection;

    subsection = { type: "subsection", title: parsed.title, summary: "", items: [], empty: true, autoCreated: true, order: parsed.order };
    section.items ||= [];
    if (parsed.order) {
      let index = section.items.findIndex(item => item.type === "subsection" && Number(item.order || 9999) > parsed.order);
      if (index < 0) index = section.items.length;
      section.items.splice(index, 0, subsection);
    } else {
      section.items.push(subsection);
    }
    return subsection;
  }

  function ensureFolder(items, segments) {
    if (!segments.length) return items;
    const title = segments.map(segment => parseFolderLabel(segment).title).join(" / ");
    let folder = items.find(item => item.type === "folder" && item.title === title);
    if (!folder) {
      folder = { type: "folder", title, items: [] };
      items.push(folder);
    }
    return folder.items;
  }

  function placementForDirectories(directories, packageMode = false) {
    const section = ensureSection(directories[0]);
    section.items ||= [];
    if (directories.length === 1) return { section, items: section.items };
    const subsection = ensureSubsection(section, directories[1]);
    subsection.items ||= [];
    if (packageMode) return { section, subsection, items: subsection.items };
    const remaining = directories.slice(2);
    return { section, subsection, items: ensureFolder(subsection.items, remaining) };
  }

  function addResource(items, file, title = fileTitle(file.filename)) {
    items.push({ type: "resource", title, intro: "", resource: file, files: [file], autoDiscovered: true });
  }

  function shouldIgnoreFile(file) {
    const lower = file.filename.toLowerCase();
    return file.filename.startsWith(".") || [".gitkeep", "thumbs.db", "desktop.ini", "readme.md", "anleitung.md"].includes(lower);
  }

  async function addLinksFromFile(file) {
    try {
      const response = await fetch(browserPath(file.path), { cache: "no-store" });
      if (!response.ok) return;
      const links = await response.json();
      if (!Array.isArray(links)) return;
      const directories = directoryName(file.path).split("/").slice(1);
      if (!directories.length) return;
      const target = placementForDirectories(directories, false).items;
      links.forEach(link => {
        if (!link || typeof link.url !== "string" || !/^https?:\/\//i.test(link.url)) return;
        target.push({ type: "link", title: String(link.title || link.url), description: String(link.description || ""), url: link.url });
      });
    } catch (error) {
      console.warn(`Linkdatei ${file.path} konnte nicht gelesen werden.`, error);
    }
  }

  async function buildCourseFromManifest(manifest) {
    const files = manifest
      .map(manifestFile)
      .filter(file => file.path.startsWith("materialien/") && !shouldIgnoreFile(file))
      .sort((a, b) => a.path.localeCompare(b.path, "de", { numeric: true }));

    const packageRoots = files
      .filter(file => ["index.html", "index.htm"].includes(file.filename.toLowerCase()))
      .map(file => directoryName(file.path))
      .sort((a, b) => b.length - a.length);

    const linkFiles = [];
    for (const file of files) {
      const packageRoot = packageRoots.find(root => file.path === `${root}/index.html` || file.path === `${root}/index.htm` || file.path.startsWith(`${root}/`));
      if (packageRoot) {
        if (!["index.html", "index.htm"].includes(file.filename.toLowerCase())) continue;
        const directories = packageRoot.split("/").slice(1);
        if (!directories.length) continue;
        const target = placementForDirectories(directories, true).items;
        addResource(target, file, parseFolderLabel(directories.at(-1)).title);
        continue;
      }

      if (file.filename.toLowerCase() === "links.json") {
        linkFiles.push(file);
        continue;
      }

      const directories = directoryName(file.path).split("/").slice(1);
      if (!directories.length) continue;
      const target = placementForDirectories(directories, false).items;
      addResource(target, file);
    }

    await Promise.all(linkFiles.map(addLinksFromFile));

    data.sections.sort((a, b) => Number(a.number) - Number(b.number));
    data.sections.forEach(section => {
      section.empty = countMaterials(section.items || []) === 0;
      (section.items || []).forEach(item => {
        if (item.type === "subsection") item.empty = countMaterials(item.items || []) === 0;
      });
    });
  }

  try {
    await buildCourseFromManifest(await loadMaterialManifest());
  } catch (error) {
    console.warn("Die hochgeladenen Materialien konnten nicht vollständig ergänzt werden.", error);
  }

  data.sections.forEach(renderSection);

  const searchInput = $("#searchInput");
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim().toLowerCase();
    let visible = 0;
    $$(".section-card", grid).forEach(card => {
      const match = !term || card.dataset.search.includes(term);
      card.hidden = !match;
      if (match) visible += 1;
    });
    $("#searchStatus").textContent = term ? `${visible} von ${data.sections.length} Bereichen gefunden` : "";
    $("#emptySearch").hidden = visible !== 0;
  });

  const menuButton = $("#menuButton");
  const sidebar = $("#sidebar");
  menuButton.addEventListener("click", () => {
    const open = !sidebar.classList.contains("open");
    sidebar.classList.toggle("open", open);
    menuButton.setAttribute("aria-expanded", String(open));
  });

  function closeSidebar() {
    sidebar.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  }

  const initialHash = location.hash;
  if (initialHash.startsWith("#section-")) {
    const target = document.querySelector(initialHash);
    if (target) {
      const cover = $(".section-cover", target);
      const content = $(".section-content", target);
      setExpanded(cover, content, true);
      target.classList.add("open");
      setTimeout(() => target.scrollIntoView({ block: "start" }), 0);
    }
  }
})().catch(error => {
  console.error("Die Kursseite konnte nicht initialisiert werden.", error);
});
