let portfolioData = window.portfolioDataFallback || { page: {}, projects: [], notes: [] };

const state = { feedTab: "notes", noteFilter: "全部", noteQuery: "" };
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
let lastFocusedElement = null;

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element && value !== undefined && value !== null) element.textContent = value;
}

function setHref(id, value) {
  const element = document.getElementById(id);
  if (!element) return;
  const url = safeUrl(value);
  element.href = url === "#" ? "#" : url;
  element.hidden = url === "#";
}

function iconSymbol(name) {
  return ({ calendar: "▦", article: "▤", folder: "▣", clock: "◷", chart: "▥", experiment: "✦", spark: "◇", data: "▤", agent: "◎", fix: "✓", gear: "⚙", heart: "♥", comment: "●", bookmark: "◆", rank: "↗", brain: "✦" })[name] || "•";
}

function metricNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("zh-CN") : String(value || fallback);
}

function renderPage() {
  const page = portfolioData.page || {};
  const profile = page.profile || {};
  const author = page.author || {};
  const notes = Array.isArray(portfolioData.notes) ? portfolioData.notes : [];
  const projects = Array.isArray(portfolioData.projects) ? portfolioData.projects : [];
  const blogName = page.blogName || "MimiQuark 技术博客";
  const displayName = profile.displayName || author.displayName || "MimiQuark";
  const avatarImage = profile.avatarImage || "";
  const avatarText = profile.avatarText || author.avatarText || "MQ";
  const stats = Array.isArray(profile.stats) && profile.stats.length ? profile.stats : [
    { label: "总访问量", value: "0" },
    { label: "原创", value: notes.length },
    { label: "项目", value: projects.length },
    { label: "分类", value: new Set(notes.map(item => item.category).filter(Boolean)).size }
  ];
  const columns = Array.isArray(profile.columns) && profile.columns.length ? profile.columns : Array.from(
    notes.reduce((map, note) => {
      if (note.category) map.set(note.category, (map.get(note.category) || 0) + 1);
      return map;
    }, new Map())
  ).map(([title, count]) => ({ title, count, icon: "article" }));
  const interests = Array.isArray(profile.interests) ? profile.interests : [];

  document.title = page.metaTitle || blogName;
  const description = document.querySelector('meta[name="description"]');
  if (description && page.metaDescription) description.setAttribute("content", page.metaDescription);
  setText("brandName", blogName);
  setText("footerName", blogName);
  setText("profileName", displayName);
  setText("profileHeadline", profile.headline || author.headline || "");
  setText("profileBio", profile.bio || author.bio || "");
  setText("profileAvatarText", avatarText);
  const coverContent = page.cover || {};
  setText("coverEyebrow", coverContent.eyebrow || "ENGINEERING NOTES");
  setText("coverTitle", coverContent.title || "记录问题 / 拆解方案 / 留下复盘");
  setText("coverSubtitle", coverContent.subtitle || "工业 AI · 数据工程 · LLM 应用");
  const labels = page.labels || {};
  setText("githubButton", labels.githubButton || "查看 GitHub");
  setText("profileAdminButton", labels.adminButton || "维护内容");
  setText("columnsTitle", labels.columnsTitle || "我的专栏");
  setText("interestsTitle", labels.interestsTitle || "写作方向");
  setText("allArticlesLabel", labels.allArticles || "全部文章");
  setText("feedSubtitle", page.feed && page.feed.subtitle ? page.feed.subtitle : "问题怎么出现、如何定位，以及最后留下了什么方法。");

  const avatar = $("#profileAvatarImage");
  if (avatar && avatarImage) {
    avatar.src = avatarImage;
    avatar.alt = displayName;
    avatar.hidden = false;
    const text = $("#profileAvatarText");
    if (text) text.hidden = true;
  }

  const cover = $("#profileCover");
  if (cover) cover.dataset.coverTheme = coverContent.theme || "aurora";
  if (cover && profile.coverImage) {
    cover.style.setProperty('--cover-image', 'url("' + String(profile.coverImage).replaceAll('"', '%22') + '")');
    cover.classList.add("has-image");
  }

  const badges = $("#profileBadges");
  if (badges) {
    const items = Array.isArray(profile.badges) ? profile.badges : (author.topics || []);
    badges.innerHTML = items.map(item => "<span>" + escapeHtml(item) + "</span>").join("");
  }

  const statTarget = $("#profileStats");
  if (statTarget) statTarget.innerHTML = stats.map(item =>
    '<div class="profile-stat"><strong' + (item.source === "visits" ? ' data-visit-count' : '') + '>' + escapeHtml(metricNumber(item.value)) + '</strong><span>' + escapeHtml(item.label) + '</span></div>'
  ).join("");

  const meta = $("#profileMeta");
  if (meta) {
    const parts = [];
    parts.push("<span>◉ " + escapeHtml(profile.status || "持续更新") + "</span>");
    parts.push("<span>⌘ GitHub Pages</span>");
    parts.push("<span>▤ 内容由 Pages CMS 管理</span>");
    meta.innerHTML = parts.join("");
  }

  const columnsTarget = $("#columnList");
  if (columnsTarget) columnsTarget.innerHTML = columns.map(item =>
    '<button class="column-item" type="button" data-column="' + escapeHtml(item.title) + '"><i class="column-icon">' + escapeHtml(iconSymbol(item.icon)) + '</i><span>' + escapeHtml(item.title) + '</span><strong>' + escapeHtml(item.count || 0) + ' 篇</strong></button>'
  ).join("");

  const interestsTarget = $("#interestList");
  if (interestsTarget) interestsTarget.innerHTML = interests.map(item =>
    '<section class="interest-item"><h3>' + escapeHtml(item.title) + '</h3><div class="interest-tags">' + (item.tags || []).map(tag => "<span>" + escapeHtml(tag) + "</span>").join("") + '</div></section>'
  ).join("");

  const adminUrl = page.adminUrl || "https://app.pagescms.org/MimiQuark/MimiQuark.github.io/main";
  ["adminLink", "profileAdminButton", "footerAdminLink"].forEach(id => setHref(id, adminUrl));
  const searchPlaceholder = page.feed && page.feed.searchPlaceholder ? page.feed.searchPlaceholder : "搜索文章、项目或技术关键词…";
  ["siteSearch", "noteSearch"].forEach(id => { const input = document.getElementById(id); if (input) input.placeholder = searchPlaceholder; });
  renderFeedTabs();
  renderFeedFilters();
}

async function updateVisitCount() {
  const profile = (portfolioData.page || {}).profile || {};
  const config = profile.visitCounter || {};
  const fallback = Number(config.fallback || 0);
  let value = fallback;
  try {
    if (["localhost", "127.0.0.1", ""].includes(window.location.hostname)) throw new Error("Local preview does not increment visits");
    const endpoint = String(config.endpoint || "https://counterapi.com/api/{namespace}/{key}").replace("{namespace}", encodeURIComponent(config.namespace || "mimiquark")).replace("{key}", encodeURIComponent(config.key || "tech-blog-visits"));
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) throw new Error("Visit counter unavailable");
    const result = await response.json();
    value = Number(result.value != null ? result.value : result.count);
    if (!Number.isFinite(value)) value = fallback;
  } catch (error) {
    console.info("Using fallback visit count.", error);
  }
  $$("[data-visit-count]").forEach(element => { element.textContent = metricNumber(value); });
}

function renderFeedTabs() {
  const page = portfolioData.page || {};
  const labels = page.feed || {};
  const target = $("#feedTabs");
  if (!target) return;
  const tabs = [
    { id: "notes", label: labels.notesTabLabel || "最新文章" },
    { id: "projects", label: labels.projectsTabLabel || "项目记录" }
  ];
  target.innerHTML = tabs.map(tab =>
    '<button class="feed-tab ' + (state.feedTab === tab.id ? "active" : "") + '" type="button" role="tab" aria-selected="' + (state.feedTab === tab.id ? "true" : "false") + '" data-feed-tab="' + tab.id + '">' + escapeHtml(tab.label) + '</button>'
  ).join("");
  navTabState();
}

function navTabState() {
  $$(".nav-link[data-nav-tab]").forEach(link => link.classList.toggle("active", link.dataset.navTab === state.feedTab));
}

function noteCategories() {
  const notes = Array.isArray(portfolioData.notes) ? portfolioData.notes : [];
  return ["全部"].concat(Array.from(new Set(notes.map(note => note.category).filter(Boolean))));
}

function renderFeedFilters() {
  const target = $("#feedFilters");
  if (!target) return;
  if (state.feedTab !== "notes") { target.innerHTML = ""; return; }
  target.innerHTML = noteCategories().map(category =>
    '<button class="filter-chip ' + (category === state.noteFilter ? "active" : "") + '" type="button" data-filter="' + escapeHtml(category) + '">' + escapeHtml(category) + '</button>'
  ).join("");
}

function searchableNote(note) {
  const sectionText = (note.sections || []).map(section => (section.heading || "") + " " + (section.content || "")).join(" ");
  return [note.title, note.excerpt, note.category, note.lead, sectionText].join(" ").toLowerCase();
}

function renderFeed() {
  const page = portfolioData.page || {};
  const feed = page.feed || {};
  setText("feedTitle", state.feedTab === "projects" ? (feed.projectsTabLabel || "项目记录") : (feed.notesTabLabel || "最新文章"));
  setText("feedSubtitle", state.feedTab === "projects" ? "项目背景、职责、关键难点与解决方案。" : (feed.subtitle || "记录项目过程、问题排查与工程复盘。"));
  renderFeedTabs();
  renderFeedFilters();
  const target = $("#feedList");
  if (!target) return;
  target.innerHTML = state.feedTab === "projects" ? renderProjectItems() : renderNoteItems();
  const empty = $("#feedEmpty");
  if (empty) {
    empty.hidden = target.innerHTML.trim() !== "";
    const strong = $("strong", empty);
    if (strong) strong.textContent = feed.emptyText || "没有找到匹配内容";
  }
}

function noteMeta(note) {
  const items = ["<strong>原创</strong>", "<span>更新于 " + escapeHtml(note.date || "未设置") + "</span>", "<span>" + escapeHtml(note.readTime || "阅读") + "</span>"];
  const optional = [["views", "阅读"], ["likes", "点赞"], ["comments", "评论"], ["bookmarks", "收藏"]];
  optional.forEach(([key, label]) => { if (Number(note[key]) > 0) items.push("<span>" + escapeHtml(metricNumber(note[key])) + " " + label + "</span>"); });
  return items.join("");
}

function renderNoteItems() {
  const query = state.noteQuery.trim().toLowerCase();
  const notes = (Array.isArray(portfolioData.notes) ? portfolioData.notes : []).filter(note => {
    const matchesCategory = state.noteFilter === "全部" || note.category === state.noteFilter;
    return matchesCategory && (!query || searchableNote(note).includes(query));
  });
  return notes.map((note, index) =>
    '<article class="feed-item note-feed-item">' +
      '<div class="feed-tile" style="background:' + ["#315d9d", "#2f7b68", "#6d5db4", "#b45d33"][index % 4] + '"><strong>' + escapeHtml("#" + (note.category || "文章")) + '</strong><span>' + escapeHtml(note.number || "") + '</span></div>' +
      '<div class="feed-copy">' +
        '<button class="feed-title" type="button" data-note="' + escapeHtml(note.id) + '">' + escapeHtml(note.title || "") + '</button>' +
        '<p class="feed-excerpt">' + escapeHtml(note.excerpt || note.lead || "") + '</p>' +
        '<div class="feed-meta">' + noteMeta(note) + '</div>' +
        '<div class="feed-actions"><button class="feed-action" type="button" data-note="' + escapeHtml(note.id) + '">阅读全文</button><span class="feed-action">' + escapeHtml(note.readTime || "阅读") + '</span></div>' +
      '</div>' +
    '</article>'
  ).join("");
}

function renderProjectItems() {
  const query = state.noteQuery.trim().toLowerCase();
  const projects = (Array.isArray(portfolioData.projects) ? portfolioData.projects : []).filter(project =>
    !query || [project.title, project.summary, project.type, (project.stack || []).join(" ")].join(" ").toLowerCase().includes(query)
  );
  return projects.map((project, index) =>
    '<article class="feed-item project-feed-item">' +
      '<div class="feed-tile" style="background:' + ["#2f7b68", "#315d9d", "#b45d33", "#6d5db4"][index % 4] + '"><strong>#' + escapeHtml(project.type || "项目") + '</strong><span>' + escapeHtml(project.number || "") + '</span></div>' +
      '<div class="feed-copy">' +
        '<button class="feed-title" type="button" data-project="' + escapeHtml(project.id) + '">' + escapeHtml(project.title || "") + '</button>' +
        '<p class="feed-excerpt">' + escapeHtml(project.summary || "") + '</p>' +
        '<div class="feed-meta"><strong>项目归档</strong><span>' + escapeHtml(project.period || "") + '</span><span>' + escapeHtml((project.stack || []).slice(0, 4).join(" · ")) + '</span></div>' +
        '<div class="feed-actions"><button class="feed-action" type="button" data-project="' + escapeHtml(project.id) + '">查看项目拆解</button><span class="feed-action">' + escapeHtml(project.highlight || "项目复盘") + '</span></div>' +
      '</div>' +
    '</article>'
  ).join("");
}

function safeUrl(value) {
  const url = String(value || "").trim();
  if (url.startsWith("/") || url.startsWith("https://") || url.startsWith("http://")) return escapeHtml(url);
  return "#";
}

function renderInlineMarkdown(value) {
  let output = escapeHtml(value);
  output = output.replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g, '<img src="$2" alt="$1">');
  output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return output;
}

function renderMarkdown(markdown) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let inCode = false;
  let code = [];
  let listType = null;
  const closeList = () => { if (listType) { html.push("</" + listType + ">"); listType = null; } };
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const line = raw.trim();
    if (line.startsWith("```")) {
      if (inCode) { html.push("<pre><code>" + escapeHtml(code.join("\n")) + "</code></pre>"); code = []; inCode = false; }
      else { closeList(); inCode = true; }
      continue;
    }
    if (inCode) { code.push(raw); continue; }
    if (!line) { closeList(); continue; }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) { closeList(); html.push("<h" + heading[1].length + ">" + renderInlineMarkdown(heading[2]) + "</h" + heading[1].length + ">"); continue; }
    if (/^---+$/.test(line)) { closeList(); html.push("<hr>"); continue; }
    if (/^>\s+/.test(line)) { closeList(); html.push("<blockquote>" + renderInlineMarkdown(line.replace(/^>\s+/, "")) + "</blockquote>"); continue; }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      const nextType = unordered ? "ul" : "ol";
      if (listType !== nextType) { closeList(); listType = nextType; html.push("<" + listType + ">"); }
      html.push("<li>" + renderInlineMarkdown((unordered || ordered)[1]) + "</li>");
      continue;
    }
    if (/^!\[[^\]]*\]\([^)]+\)$/.test(line)) { closeList(); html.push("<figure>" + renderInlineMarkdown(line) + "</figure>"); continue; }
    if (/^<video\b[\s\S]*<\/video>$/i.test(line)) { closeList(); html.push(line); continue; }
    closeList();
    html.push("<p>" + renderInlineMarkdown(line) + "</p>");
  }
  closeList();
  if (inCode) html.push("<pre><code>" + escapeHtml(code.join("\n")) + "</code></pre>");
  return html.join("");
}

function renderRichContent(rawContent) {
  if (Array.isArray(rawContent)) return "<ul>" + rawContent.map(item => "<li>" + escapeHtml(item) + "</li>").join("") + "</ul>";
  const text = String(rawContent || "").trim();
  if (text.startsWith("<")) return '<div class="rich-text">' + text + "</div>";
  return "<p>" + renderInlineMarkdown(text).replaceAll("\n", "<br>") + "</p>";
}

async function openProject(id) {
  const project = (portfolioData.projects || []).find(item => item.id === id);
  if (!project) return;
  if (project.detailMarkdown) {
    try {
      const response = await fetch(project.detailMarkdown, { cache: "no-store" });
      if (!response.ok) throw new Error("Project detail unavailable");
      const markdown = await response.text();
      openModal({ eyebrow: project.type || "项目", number: project.number || "", meta: [project.period, (project.stack || []).join(" / ")].filter(Boolean).join(" · "), title: project.title || "项目详情", markdown });
      return;
    } catch (error) { console.info("Using project summary.", error); }
  }
  openModal({
    eyebrow: project.type || "项目",
    number: project.number || "",
    meta: [project.period, (project.stack || []).join(" / ")].filter(Boolean).join(" · "),
    title: project.title || "项目详情",
    lead: project.summary || "",
    sections: [
      { heading: "遇到的问题", content: project.challenge || [] },
      { heading: "解决方法", content: project.solution || [] },
      { heading: "结果与复盘", content: project.impact || [] }
    ]
  });
}

function openNote(id) {
  const note = (portfolioData.notes || []).find(item => item.id === id);
  if (!note) return;
  openModal({
    eyebrow: note.category || "经验总结",
    number: note.number || "",
    meta: [note.date, note.readTime, note.views != null ? metricNumber(note.views) + " 阅读" : ""].filter(Boolean).join(" · "),
    title: note.title || "文章详情",
    lead: note.lead || note.excerpt || "",
    sections: note.sections || []
  });
}

function openModal(data) {
  const panel = $(".modal-panel");
  setText("modalEyebrow", data.eyebrow || "");
  setText("modalNumber", data.number || "");
  setText("modalMeta", data.meta || "");
  setText("modalTitle", data.title || "");
  setText("modalLead", data.lead || "");
  const target = $("#modalSections");
  if (data.markdown) {
    panel.classList.add("markdown-mode");
    target.innerHTML = '<article class="project-markdown">' + renderMarkdown(data.markdown) + '</article>';
  } else {
    panel.classList.remove("markdown-mode");
    target.innerHTML = (data.sections || []).map(section => '<section><h3>' + escapeHtml(section.heading || "") + '</h3>' + renderRichContent(section.content) + '</section>').join("");
  }
  lastFocusedElement = document.activeElement;
  $("#detailModal").classList.add("open");
  $("#detailModal").setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  panel.scrollTop = 0;
  $(".modal-close").focus();
}

function closeModal() {
  $("#detailModal").classList.remove("open");
  $("#detailModal").setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  if (lastFocusedElement) lastFocusedElement.focus();
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("project-notes-theme", theme);
  $(".theme-toggle").setAttribute("aria-label", theme === "dark" ? "切换浅色模式" : "切换深色模式");
  $('meta[name="theme-color"]').setAttribute("content", theme === "dark" ? "#111417" : "#f3f5f7");
}

document.addEventListener("click", event => {
  const noteButton = event.target.closest("[data-note]");
  const projectButton = event.target.closest("[data-project]");
  const filterButton = event.target.closest("[data-filter]");
  const tabButton = event.target.closest("[data-feed-tab]");
  const columnButton = event.target.closest("[data-column]");
  if (noteButton) openNote(noteButton.dataset.note);
  if (projectButton) openProject(projectButton.dataset.project);
  if (filterButton) { state.noteFilter = filterButton.dataset.filter; renderFeed(); }
  if (tabButton) { state.feedTab = tabButton.dataset.feedTab; renderFeed(); document.getElementById("articles").scrollIntoView({ behavior: "smooth", block: "start" }); }
  if (columnButton) { state.feedTab = "notes"; state.noteFilter = columnButton.dataset.column; renderFeed(); document.getElementById("articles").scrollIntoView({ behavior: "smooth", block: "start" }); }
  if (event.target.closest("[data-close-modal]")) closeModal();
});

["siteSearch", "noteSearch"].forEach(id => {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener("input", event => {
    state.noteQuery = event.target.value;
    ["siteSearch", "noteSearch"].forEach(otherId => { const other = document.getElementById(otherId); if (other && other !== event.target) other.value = state.noteQuery; });
    if (state.feedTab !== "notes" && !state.noteQuery) state.feedTab = "notes";
    renderFeed();
  });
});

$(".theme-toggle").addEventListener("click", () => setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"));
const menuToggle = $(".menu-toggle");
const mainNav = $(".main-nav");
menuToggle.addEventListener("click", () => { const open = mainNav.classList.toggle("open"); menuToggle.setAttribute("aria-expanded", String(open)); });
$$(".main-nav a").forEach(link => link.addEventListener("click", () => { mainNav.classList.remove("open"); menuToggle.setAttribute("aria-expanded", "false"); }));

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if ($("#detailModal").classList.contains("open")) closeModal();
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

const header = $("#siteHeader");
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 16);
}, { passive: true });

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); } });
}, { threshold: 0.08 });
function observeReveals() { $$(".reveal").forEach(element => { if (!element.classList.contains("visible")) observer.observe(element); }); }

async function loadManagedContent() {
  try {
    const responses = await Promise.all([
      fetch("_data/site.json", { cache: "no-store" }),
      fetch("_data/projects.json", { cache: "no-store" }),
      fetch("_data/notes.json", { cache: "no-store" })
    ]);
    if (responses.some(response => !response.ok)) throw new Error("Managed content unavailable");
    const site = await responses[0].json();
    const projects = await responses[1].json();
    const notes = await responses[2].json();
    portfolioData = { page: site.page || {}, projects: projects.items || [], notes: notes.items || [] };
  } catch (error) { console.info("Using bundled fallback content.", error); }
}

async function boot() {
  await loadManagedContent();
  renderPage();
  renderFeed();
  updateVisitCount();
  observeReveals();
  setTheme(localStorage.getItem("project-notes-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  $("#currentYear").textContent = new Date().getFullYear();
}

boot();
