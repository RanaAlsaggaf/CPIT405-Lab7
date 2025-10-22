const ACCESS_KEY = "0wid3bCBGZQKP4j8T0dmD89VrWCPWebekYgpbbASEg4";
const PER_PAGE = 24;

const $ = (sel) => document.querySelector(sel);
const grid = $("#grid");
const statusEl = $("#status");
const input = $("#query");

function buildUrl(query, page = 1) {
    const params = new URLSearchParams({
        query,
        per_page: PER_PAGE.toString(),
        page: page.toString(),
        orientation: "portrait"
    });
    return `https://api.unsplash.com/search/photos?${params.toString()}`;
}

function setStatus(text, isError = false) {
    statusEl.textContent = text;
    statusEl.classList.toggle("error", isError);
}

function clearGrid() {
    grid.innerHTML = "";
}

function renderPhotos(results = []) {
    clearGrid();
    if (!results.length) {
        setStatus("No results. Try another keyword.", true);
        return;
    }
    const frag = document.createDocumentFragment();
    results.forEach((photo) => {
        const card = document.createElement("article");
        card.className = "card";

        const img = document.createElement("img");
        img.className = "thumb";
        img.loading = "lazy";
        img.alt = photo.alt_description || `Photo by ${photo.user?.name || "Unknown"} on Unsplash`;
        img.src = photo.urls?.small || photo.urls?.regular || photo.urls?.thumb;
        card.appendChild(img);

        const meta = document.createElement("div");
        meta.className = "meta";
        const by = document.createElement("a");
        by.href = photo.user?.links?.html || "#";
        by.target = "_blank";
        by.rel = "noopener noreferrer";
        by.textContent = photo.user?.name || "Unknown";
        const likes = document.createElement("span");
        likes.className = "count";
        likes.textContent = `❤ ${photo.likes ?? 0}`;
        meta.appendChild(by);
        meta.appendChild(likes);

        card.appendChild(meta);
        frag.appendChild(card);
    });
    grid.appendChild(frag);
    setStatus(`Showing ${results.length} result(s). Photo credits link to the photographer on Unsplash.`);
}

function handleHttpError(res) {
    if (!res.ok) {
        const limit = res.headers.get("x-ratelimit-remaining");
        const msg = limit !== null
            ? `HTTP ${res.status}. Remaining requests this hour: ${limit}.`
            : `HTTP ${res.status}.`;
        throw new Error(msg);
    }
    return res;
}

async function searchWithXHR() {
    const query = input.value.trim();
    if (!query) return setStatus("Please enter a search term.", true);

    setStatus("Searching (XHR)…");
    clearGrid();

    const url = buildUrl(query);
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Authorization", `Client-ID ${ACCESS_KEY}`);

    xhr.onload = () => {
        try {
            if (xhr.status < 200 || xhr.status >= 300) {
                throw new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
            }
            const data = JSON.parse(xhr.responseText);
            renderPhotos(data.results || []);
        } catch (err) {
            setStatus(err.message, true);
        }
    };

    xhr.onerror = () => setStatus("Network error (XHR).", true);
    xhr.send();
}

function searchWithFetchPromises() {
    const query = input.value.trim();
    if (!query) return setStatus("Please enter a search term.", true);

    setStatus("Searching (fetch + promises) …");
    clearGrid();

    const url = buildUrl(query);
    fetch(url, {
        headers: { Authorization: `Client-ID ${ACCESS_KEY}` }
    })
        .then(handleHttpError)
        .then((res) => res.json())
        .then((data) => renderPhotos(data.results || []))
        .catch((err) => setStatus(err.message, true));
}

async function searchWithAsyncAwait() {
    const query = input.value.trim();
    if (!query) return setStatus("Please enter a search term.", true);

    setStatus("Searching (async/await) …");
    clearGrid();

    const url = buildUrl(query);
    try {
        const res = await fetch(url, {
            headers: { Authorization: `Client-ID ${ACCESS_KEY}` }
        });
        handleHttpError(res);
        const data = await res.json();
        renderPhotos(data.results || []);
    } catch (err) {
        setStatus(err.message, true);
    }
}

$("#btn-xhr").addEventListener("click", searchWithXHR);
$("#btn-fetch").addEventListener("click", searchWithFetchPromises);
$("#btn-async").addEventListener("click", searchWithAsyncAwait);

input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchWithAsyncAwait();
});

window.addEventListener("DOMContentLoaded", () => {
    searchWithAsyncAwait();
});
