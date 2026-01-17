import { bangs } from "./bang";
import "./global.css";

function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div class="landing-container">
      <div class="logo">
        <img src="/TimoSearch.png" alt="TimoSearch" />
      </div>
      <h1>TimoSearch</h1>
      <p class="tagline">Fast, private search with bangs</p>
      <p class="description">DuckDuckGo's bang redirects are too slow. Add the URL below as a custom search engine in your browser to search directly on <a href="https://duckduckgo.com/bang.html" target="_blank">10,000+ sites</a> instantly.</p>
      <div class="url-container"> 
        <input 
          type="text" 
          class="url-input"
          value="https://search.hkjc.uk?q=%s"
          readonly 
        />
        <button class="copy-button" title="Copy to clipboard">
          <svg class="icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <svg class="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
      <p class="hint">Paste the URL above into your browser's search engine settings</p>
      <footer class="footer">
        <span>A fork of <a href="https://unduck.link" target="_blank">Unduck</a></span>
        <span class="divider">•</span>
        <a href="https://github.com/timothy0509/search" target="_blank">github</a>
        <span class="divider">•</span>
        <a href="mailto:timothy@hkjc.uk">timothy@hkjc.uk</a>
      </footer>
    </div>
  `;

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyButton.classList.add("copied");

    setTimeout(() => {
      copyButton.classList.remove("copied");
    }, 2000);
  });
}

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

doRedirect();
