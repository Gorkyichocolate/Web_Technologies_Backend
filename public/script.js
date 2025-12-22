// Core client logic (all work here, HTML is only the shell)
(() => {
    const state = { lastUser: null, lastCountry: null };

    // Helpers
    const qs = sel => document.querySelector(sel);
    const qsa = sel => Array.from(document.querySelectorAll(sel));

    // Navigation
    function showView(name) {
        qsa('.view').forEach(v => v.classList.remove('active'));
        const el = qs('#' + name);
        if (el) el.classList.add('active');
        document.title = `API Demo - ${name}`;
    }

    // Renderers
    function renderRandom(user) {
        const c = qs('#random-container');
        c.innerHTML = '';
        if (!user) { c.innerHTML = '<p class="muted">No user data.</p>'; return }
        state.lastUser = user;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
      <img class="avatar" src="${user.profilePic}" alt="avatar">
      <div class="fields">
        <h2>${user.firstName} ${user.lastName} <small class="muted">${user.gender}</small></h2>
        <div class="field"><strong>Age:</strong> ${user.age}</div>
        <div class="field"><strong>Date of birth:</strong> ${new Date(user.dob).toLocaleDateString()}</div>
        <div class="field"><strong>City:</strong> ${user.city}</div>
        <div class="field"><strong>Country:</strong> ${user.country}</div>
        <div class="field"><strong>Address:</strong> ${user.address}</div>
        <div style="margin-top:8px"><button data-action="to-country" class="btn btn-country">View Country Info</button>
          <button data-action="to-exchange" class="btn btn-exchange">View Exchange</button>
          <button data-action="to-news" class="btn btn-news">View News</button>
        </div>
      </div>
    `;
        c.appendChild(card);
    }

    function renderCountry(country) {
        const c = qs('#country-container');
        c.innerHTML = '';
        if (!country) { c.innerHTML = '<p class="muted">No country data.</p>'; return }
        state.lastCountry = country;
        const el = document.createElement('div');
        el.className = 'country-card';
        el.innerHTML = `
      <img class="country-flag" src="${country.flag}" alt="flag">
      <div class="fields">
        <h2>${country.name || 'N/A'}</h2>
        <div class="field"><strong>Capital:</strong> ${country.capital}</div>
        <div class="field"><strong>Languages:</strong> ${country.languages}</div>
        <div class="field"><strong>Currency:</strong> ${country.currencyCode}</div>
      </div>
    `;
        c.appendChild(el);
    }

    function renderExchange(exchange) {
        const c = qs('#exchange-container');
        c.innerHTML = '';
        if (!exchange) { c.innerHTML = '<p class="muted">No exchange data.</p>'; return }
        const el = document.createElement('div');
        el.className = 'rates';
        el.innerHTML = `
      <div class="rate"><strong>Base:</strong> ${exchange.base}</div>
      <div class="rate"><strong>USD:</strong> ${exchange.usd}</div>
      <div class="rate"><strong>KZT:</strong> ${exchange.kzt}</div>
    `;
        c.appendChild(el);
    }

    function renderNews(news) {
        const c = qs('#news-container');
        c.innerHTML = '';
        if (!news || !news.length) { c.innerHTML = '<p class="muted">No news available.</p>'; return }
        const list = document.createElement('div');
        list.className = 'news-list';
        news.forEach(a => {
            const item = document.createElement('div');
            item.className = 'news-item';
            item.innerHTML = `
        ${a.image ? `<img src="${a.image}" alt="img">` : ''}
        <div>
          <h3 style="margin:0"><a href="${a.url}" target="_blank" rel="noopener" style="color:inherit">${a.title}</a></h3>
          <p class="muted" style="margin:6px 0">${a.description || ''}</p>
        </div>
      `;
            list.appendChild(item);
        });
        c.appendChild(list);
    }

    // Fetchers
    async function fetchRandom() {
        const res = await fetch('/randomuser');
        if (!res.ok) throw new Error('Random user failed');
        return res.json();
    }

    async function fetchCountry(country, code) {
        const params = new URLSearchParams({ country, code });
        const res = await fetch(`/countries?${params.toString()}`);
        if (!res.ok) throw new Error('Country fetch failed');
        return res.json();
    }

    async function fetchExchange(currency) {
        const params = new URLSearchParams({ currency });
        const res = await fetch(`/exchange-rate?${params.toString()}`);
        if (!res.ok) throw new Error('Exchange fetch failed');
        return res.json();
    }

    async function fetchNews(country) {
        const params = new URLSearchParams({ country });
        const res = await fetch(`/news?${params.toString()}`);
        if (!res.ok) throw new Error('News fetch failed');
        return res.json();
    }

    // Wire up UI
    function setup() {
        // main nav
        qsa('[data-view]').forEach(btn => btn.addEventListener('click', e => {
            const view = btn.getAttribute('data-view');
            showView(view);
            if (view === 'random') loadRandom();
        }));

        // back buttons
        qsa('.back').forEach(b => b.addEventListener('click', () => showView('home')));

        // random page controls
        qs('#random .refresh').addEventListener('click', loadRandom);
        qs('#random-container').addEventListener('click', e => {
            const action = e.target.getAttribute('data-action');
            if (!action || !state.lastUser) return;
            if (action === 'to-country') {
                showView('country');
                // prefill and auto-fetch
                qs('#country-form input[name="country"]').value = state.lastUser.country;
                qs('#country-form input[name="code"]').value = state.lastUser.countryCode || '';
                qs('#country-form').dispatchEvent(new Event('submit', { cancelable: true }));
            }
            if (action === 'to-exchange') {
                showView('exchange');
                qs('#exchange-form input[name="currency"]').value = (state.lastCountry && state.lastCountry.currencyCode) || '';
                qs('#exchange-form').dispatchEvent(new Event('submit', { cancelable: true }));
            }
            if (action === 'to-news') {
                showView('news');
                qs('#news-form input[name="country"]').value = state.lastUser.country;
                qs('#news-form').dispatchEvent(new Event('submit', { cancelable: true }));
            }
        });

        // country form
        qs('#country-form').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const country = ev.target.country.value.trim();
            const code = ev.target.code.value.trim().toLowerCase();
            try {
                qs('#country-container').innerHTML = '<p class="muted">Loading…</p>';
                const data = await fetchCountry(country, code);
                // normalize
                const cleaned = {
                    name: data.name || country,
                    capital: data.capital || 'N/A',
                    languages: data.languages || 'N/A',
                    currencyCode: data.currencyCode || (data.currency || 'N/A'),
                    flag: data.flag || (code ? `https://flagcdn.com/w320/${code}.png` : '')
                };
                renderCountry(cleaned);
            } catch (err) {
                qs('#country-container').innerHTML = `<p class="muted">Error: ${err.message}</p>`;
            }
        });

        // exchange form
        qs('#exchange-form').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const currency = ev.target.currency.value.trim().toUpperCase();
            try {
                qs('#exchange-container').innerHTML = '<p class="muted">Loading…</p>';
                const data = await fetchExchange(currency);
                renderExchange(data);
            } catch (err) {
                qs('#exchange-container').innerHTML = `<p class="muted">Error: ${err.message}</p>`;
            }
        });

        // news form
        qs('#news-form').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const country = ev.target.country.value.trim();
            try {
                qs('#news-container').innerHTML = '<p class="muted">Loading…</p>';
                const data = await fetchNews(country);
                renderNews(data);
            } catch (err) {
                qs('#news-container').innerHTML = `<p class="muted">Error: ${err.message}</p>`;
            }
        });

        // helpers to prefill from last user/country
        qsa('.fetch-from-user').forEach(btn => btn.addEventListener('click', () => {
            if (!state.lastUser) return alert('Fetch a random user first');
            showView('country');
            qs('#country-form input[name="country"]').value = state.lastUser.country;
            qs('#country-form input[name="code"]').value = state.lastUser.countryCode || '';
            qs('#country-form').dispatchEvent(new Event('submit'));
        }));

        qsa('.fetch-from-country').forEach(btn => btn.addEventListener('click', () => {
            if (!state.lastCountry) return alert('Get country info first');
            showView('exchange');
            qs('#exchange-form input[name="currency"]').value = state.lastCountry.currencyCode || '';
            qs('#exchange-form').dispatchEvent(new Event('submit'));
        }));
    }

    // initial load
    async function loadRandom() {
        try {
            qs('#random-container').innerHTML = '<p class="muted">Loading…</p>';
            const user = await fetchRandom();
            renderRandom(user);
        } catch (err) {
            qs('#random-container').innerHTML = `<p class="muted">Error: ${err.message}</p>`;
        }
    }

    // Start
    document.addEventListener('DOMContentLoaded', () => {
        setup();
    });

})();
