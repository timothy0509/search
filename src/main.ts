import { bangs } from "./bang";
import "./global.css";

const LS_DEFAULT_BANG = localStorage.getItem("default-bang") ?? "g";
const defaultBang = bangs.find((b) => b.t === LS_DEFAULT_BANG);

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);

  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang = bangs.find((b) => b.t === bangCandidate) ?? defaultBang;

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // If the query is just `!gh`, use `github.com` instead of `github.com/search?q=`
  if (cleanQuery === "")
    return selectedBang ? `https://${selectedBang.d}` : null;

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = selectedBang?.u.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
  );
  if (!searchUrl) return null;

  return searchUrl;
}

function doRedirect() {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

type Bang = (typeof bangs)[number];

function resolveQuery(query: string): {
  bang: string | null;
  entry: Bang | undefined;
  clean: string;
  url: string | null;
} {
  const q = query.trim();
  const match = q.match(/!(\S+)/i);
  const bang = match?.[1]?.toLowerCase() ?? null;
  const entry = bang ? bangs.find((b) => b.t === bang) : undefined;
  const fallback = !bang ? defaultBang : undefined;
  const selected = entry ?? fallback;
  const clean = q.replace(/!\S+\s*/i, "").trim();
  if (!selected) return { bang, entry: undefined, clean, url: null };
  if (!q) return { bang: null, entry: undefined, clean: "", url: null };
  if (clean === "") return { bang, entry: selected, clean, url: `https://${selected.d}` };
  return {
    bang,
    entry: selected,
    clean,
    url: selected.u.replace("{{{s}}}", encodeURIComponent(clean).replace(/%2F/g, "/")),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const POPULAR = ["g", "gh", "w", "yt", "so", "npmx", "t3", "r"];
const TRY_QUERIES = ["!w Eiffel Tower", "!gh TimoSearch", "!yt lofi hip hop", "!so css grid center"];

function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const total = bangs.length.toLocaleString("en-US");

  app.innerHTML = `
    <div class="bg" aria-hidden="true"><div class="bg-grid"></div><div class="bg-route"></div></div>
    <div class="shell">
      <header class="nav">
        <div class="brand"><img src="/TimoSearch.png" alt="" />TimoSearch</div>
        <nav class="nav-links">
          <span class="count-pill">${total} bangs</span>
          <a class="ghost-link" href="https://github.com/timothy0509/search" target="_blank" rel="noopener">GitHub</a>
        </nav>
      </header>

      <main>
        <section class="hero">
          <p class="eyebrow"><span class="pulse"></span>CLIENT-SIDE BANG ROUTER</p>
          <h1>Type <span class="bang-hl">!anything</span>,<br />land anywhere.</h1>
          <p class="sub">DuckDuckGo's bang redirects are slow — they bounce through <strong>their servers</strong>. TimoSearch resolves them <strong>on your device</strong>, instantly. Set it as your search engine once, then jump straight to ${total} sites.</p>

          <div class="terminal">
            <div class="term-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="term-title">timosearch — live preview</span></div>
            <div class="term-body">
              <div class="term-input-row">
                <span class="prompt" aria-hidden="true">›</span>
                <input id="demo-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"
                  placeholder="!w Eiffel Tower" aria-label="Try a bang query" />
                <button class="go-btn" id="go-btn">Go →</button>
              </div>
              <div class="route" id="route" aria-live="polite"></div>
              <p class="kbd-hint">Press <kbd>/</kbd> to focus · <kbd>↵</kbd> to go · no bang = your default engine</p>
            </div>
          </div>

          <div class="stats">
            <div class="stat mint"><b>0 ms</b><span>round-trip · runs locally</span></div>
            <div class="stat sky"><b>${total}</b><span>bangs, cached in-browser</span></div>
            <div class="stat amber"><b>0 bytes</b><span>tracking · no logs</span></div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <span class="section-label">SETUP — 60 SECONDS</span>
            <h2>Make every search a shortcut</h2>
            <p>Add TimoSearch as a custom search engine, then type bangs straight into your address bar.</p>
          </div>
          <div class="cards">
            <div class="card">
              <p class="card-step">STEP — COPY</p>
              <h3>Grab the engine URL</h3>
              <p>This is the address your browser pings. <code>%s</code> is where your query goes.</p>
              <div class="copy-row">
                <input id="engine-url" type="text" readonly value="https://search.hkjc.uk?q=%s" aria-label="Search engine URL" />
                <button class="copy-btn" id="copy-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <span>Copy</span>
                </button>
              </div>
            </div>
            <div class="card">
              <p class="card-step">STEP — ADD</p>
              <h3>Register it in your browser</h3>
              <p>Chrome / Arc: <code>Settings → Search engine → Add</code>. Firefox: <code>Settings → Search → Add</code>. Paste the URL, set keyword to <code>t</code>.</p>
            </div>
            <div class="card">
              <p class="card-step">STEP — GO</p>
              <h3>Prefix anything with !</h3>
              <p>Click one to load it in the preview above, then hit Go.</p>
              <div class="try-list" id="try-list"></div>
            </div>
          </div>
          <div class="prefs">
            <span class="prefs-label">No bang? Queries fall back to <b id="default-label">!${escapeHtml(LS_DEFAULT_BANG)}</b></span>
            <div class="prefs-row">
              <input id="default-bang" type="text" value="${escapeHtml(LS_DEFAULT_BANG)}" aria-label="Default bang" spellcheck="false" />
              <button class="save-btn" id="save-default">Save</button>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <span class="section-label">EXPLORE</span>
            <h2>${total} destinations, one ! away</h2>
            <p>Filter the full bang list. Click any card to preview it.</p>
          </div>
          <div class="explorer">
            <div class="explorer-tools">
              <input id="bang-filter" type="text" placeholder="Filter bangs — try “music”, “docs”, “shop”…" aria-label="Filter bangs" autocomplete="off" spellcheck="false" />
            </div>
            <div class="chips" id="chips"></div>
            <div class="bang-grid" id="bang-grid"></div>
            <p class="explorer-foot" id="explorer-foot"></p>
          </div>
        </section>
      </main>

      <footer class="footer">
        <span>TimoSearch — a fork of <a href="https://unduck.link" target="_blank" rel="noopener">Unduck</a></span>
        <nav>
          <a href="https://github.com/timothy0509/search" target="_blank" rel="noopener">github</a>
          <span class="sep">·</span>
          <a href="mailto:timothy@hkjc.uk">timothy@hkjc.uk</a>
        </nav>
      </footer>
    </div>
    <div class="toast" id="toast" role="status"></div>
  `;

  const demoInput = app.querySelector<HTMLInputElement>("#demo-input")!;
  const route = app.querySelector<HTMLDivElement>("#route")!;
  const goBtn = app.querySelector<HTMLButtonElement>("#go-btn")!;
  const toast = app.querySelector<HTMLDivElement>("#toast")!;

  let toastTimer = 0;
  function showToast(msg: string) {
    toast.textContent = msg;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function renderRoute() {
    const { bang, entry, clean, url } = resolveQuery(demoInput.value);
    if (!demoInput.value.trim()) {
      route.innerHTML = `<span class="empty">Type above to see the route — e.g. <b>!w Eiffel Tower</b>. Unknown bangs fall back to your default.</span>`;
      return;
    }
    if (bang && !entry) {
      route.innerHTML = `<span class="bang-tag">!${escapeHtml(bang)}</span><span class="arrow">→</span><span class="dest">unknown bang — falls back to default !${escapeHtml(LS_DEFAULT_BANG)}</span>`;
      return;
    }
    const tag = bang ? `!${escapeHtml(bang)}` : `!${escapeHtml(LS_DEFAULT_BANG)} (default)`;
    const dest = entry ? escapeHtml(entry.d) : "—";
    const queryBit = clean ? ` · “${escapeHtml(clean)}”` : " · homepage";
    route.innerHTML =
      `<span class="bang-tag">${tag}</span><span class="arrow">→</span>` +
      `<span class="dest">${dest}${queryBit}</span><span class="meta">0 ms · client-side</span>` +
      (url ? `<span class="route-preview-url">${escapeHtml(url)}</span>` : "");
  }

  function go() {
    const { bang, entry, url } = resolveQuery(demoInput.value);
    if (!demoInput.value.trim()) {
      showToast("Type a query first — try “!w Eiffel Tower”");
      demoInput.focus();
      return;
    }
    if (bang && !entry) {
      showToast(`Unknown bang “!${bang}” — using your default instead`);
    }
    if (url) window.location.href = url;
  }

  demoInput.addEventListener("input", renderRoute);
  demoInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") go();
  });
  goBtn.addEventListener("click", go);
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
      e.preventDefault();
      demoInput.focus();
    }
  });
  renderRoute();

  // Try queries
  const tryList = app.querySelector("#try-list")!;
  for (const q of TRY_QUERIES) {
    const b = document.createElement("button");
    b.className = "try-item";
    b.textContent = q;
    b.addEventListener("click", () => {
      demoInput.value = q;
      renderRoute();
      demoInput.focus();
      document.querySelector(".terminal")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    tryList.appendChild(b);
  }

  // Copy engine URL
  const copyBtn = app.querySelector<HTMLButtonElement>("#copy-btn")!;
  const engineUrl = app.querySelector<HTMLInputElement>("#engine-url")!;
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(engineUrl.value);
    } catch {
      engineUrl.select();
      document.execCommand("copy");
    }
    copyBtn.classList.add("ok");
    const label = copyBtn.querySelector("span")!;
    label.textContent = "Copied";
    showToast("Engine URL copied — paste it into your browser settings");
    setTimeout(() => {
      copyBtn.classList.remove("ok");
      label.textContent = "Copy";
    }, 2000);
  });

  // Default bang pref
  const defaultInput = app.querySelector<HTMLInputElement>("#default-bang")!;
  const defaultLabel = app.querySelector("#default-label")!;
  app.querySelector("#save-default")!.addEventListener("click", () => {
    const v = defaultInput.value.trim().replace(/^!/, "").toLowerCase();
    const found = bangs.find((b) => b.t === v);
    if (!found) {
      showToast(`No bang named “!${v || "?"}” — not saved`);
      return;
    }
    localStorage.setItem("default-bang", v);
    defaultLabel.textContent = `!${v}`;
    renderRoute();
    showToast(`Default engine set to !${v} (${found.d})`);
  });

  // Explorer
  const grid = app.querySelector<HTMLDivElement>("#bang-grid")!;
  const foot = app.querySelector<HTMLParagraphElement>("#explorer-foot")!;
  const filter = app.querySelector<HTMLInputElement>("#bang-filter")!;
  const chips = app.querySelector<HTMLDivElement>("#chips")!;

  for (const t of POPULAR) {
    const entry = bangs.find((b) => b.t === t);
    if (!entry) continue;
    const c = document.createElement("button");
    c.className = "chip";
    c.textContent = `!${t}`;
    c.title = entry.s;
    c.addEventListener("click", () => {
      demoInput.value = `!${t} `;
      renderRoute();
      demoInput.focus();
      document.querySelector(".terminal")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    chips.appendChild(c);
  }

  function renderGrid() {
    const q = filter.value.trim().toLowerCase();
    const matches = q
      ? bangs.filter(
          (b) =>
            b.t.includes(q) ||
            b.s.toLowerCase().includes(q) ||
            b.d.toLowerCase().includes(q),
        )
      : [...bangs].sort((a, b) => a.r - b.r).slice(0, 24);
    const shown = matches.slice(0, 24);
    grid.innerHTML = "";
    for (const b of shown) {
      const cell = document.createElement("button");
      cell.className = "bang-cell";
      cell.title = `Preview !${b.t}`;
      const t = document.createElement("span");
      t.className = "t";
      t.textContent = `!${b.t}`;
      const s = document.createElement("span");
      s.className = "s";
      s.textContent = b.s;
      const d = document.createElement("span");
      d.className = "d";
      d.textContent = b.d;
      cell.append(t, s, d);
      cell.addEventListener("click", () => {
        demoInput.value = `!${b.t} `;
        renderRoute();
        demoInput.focus();
        document.querySelector(".terminal")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      grid.appendChild(cell);
    }
    foot.textContent =
      matches.length === 0
        ? "No matches — try a site name or domain."
        : q
          ? `${matches.length.toLocaleString("en-US")} match${matches.length === 1 ? "" : "es"} — showing first ${shown.length}`
          : `Most-used bangs — filter to search all ${total}.`;
  }

  filter.addEventListener("input", renderGrid);
  renderGrid();
}

doRedirect();
