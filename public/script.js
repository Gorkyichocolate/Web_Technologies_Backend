(function () {
    const path = window.location.pathname;

    function qs(sel, ctx = document) {
        return ctx.querySelector(sel);
    }

    function qsa(sel, ctx = document) {
        return Array.from((ctx || document).querySelectorAll(sel));
    }

    function escapeHtml(s) {
        if (!s && s !== 0) return '';
        return String(s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    // Home page
    if (path === '/' || path.endsWith('/index.html')) {
        const container = qs('#posts');

        async function load() {
            container.innerHTML = '';
            try {
                const res = await fetch('/posts');
                const posts = await res.json();

                if (!posts.length) {
                    container.innerHTML = '<div class="empty">Пока нет новостей. Создайте их на странице "Создать".</div>';
                    return;
                }

                posts.forEach(p => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `
            ${p.image ? `<img src="${p.image}" alt="">` : ''}
            <div class="three-dots">⋮</div>
            <div class="menu">
              <button data-action="edit" data-id="${p._id}">Обновить</button>
              <button data-action="delete" data-id="${p._id}">Удалить</button>
            </div>
            <div class="title">${escapeHtml(p.title)}</div>
            <div class="meta"><div class="author">${escapeHtml(p.author)} • ${new Date(p.date).toLocaleDateString()}</div></div>
            <p>${escapeHtml(p.description)}</p>
          `;
                    container.appendChild(card);

                    const dots = card.querySelector('.three-dots');
                    const menu = card.querySelector('.menu');
                    dots.addEventListener('click', () => {
                        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                    });

                    document.addEventListener('click', (e) => {
                        if (!card.contains(e.target)) menu.style.display = 'none';
                    });

                    card.querySelector('[data-action="delete"]').addEventListener('click', async () => {
                        if (!confirm('Удалить эту новость?')) return;
                        await fetch('/posts/' + p._id, { method: 'DELETE' });
                        load();
                    });

                    card.querySelector('[data-action="edit"]').addEventListener('click', async () => {
                        const title = prompt('Title', p.title);
                        if (title === null) return;
                        const author = prompt('Author', p.author);
                        if (author === null) return;
                        const description = prompt('Description', p.description);
                        if (description === null) return;
                        const date = prompt('Date (YYYY-MM-DD)', p.date ? new Date(p.date).toISOString().slice(0, 10) : '');
                        if (date === null) return;
                        const image = prompt('Image URL', p.image || '');
                        if (image === null) return;

                        await fetch('/posts/' + p._id, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ title, author, description, date, image })
                        });
                        load();
                    });
                });
            } catch (err) {
                console.error(err);
                container.innerHTML = '<div class="empty">Ошибка загрузки</div>';
            }
        }

        load();
    }

    // Create page
    if (path === '/create' || path.endsWith('/create.html')) {
        const form = qs('#postForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fd = new FormData(form);
                try {
                    const res = await fetch('/posts', { method: 'POST', body: fd });
                    if (res.ok) {
                        window.location.href = '/';
                    } else {
                        alert('Ошибка: ' + res.statusText);
                    }
                } catch (err) {
                    console.error(err);
                    alert('Ошибка при создании');
                }
            });
        }
    }
})();

