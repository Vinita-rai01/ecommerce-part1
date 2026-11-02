
const API = '/api';

const grid = document.getElementById('product-grid');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('category');
const sortSelect = document.getElementById('sort');
const statusEl = document.getElementById('status');
const resultCount = document.getElementById('result-count');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');

const PRODUCTS_PER_PAGE = 12;

let currentPage = 0;
let totalProducts = 0;
let searchTimer = null;

const money = value =>
    new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD'
    }).format(value);

const escapeHTML = value =>
    String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);


// ==========================================
// CREATE PAGINATION CONTAINER
// ==========================================

let pagination = document.getElementById('pagination');

if (!pagination) {
    pagination = document.createElement('div');
    pagination.id = 'pagination';
    pagination.className = 'pagination';
    grid.insertAdjacentElement('afterend', pagination);
}


// ==========================================
// LOAD CATEGORIES FROM SQLITE VIA FASTAPI
// ==========================================

async function loadCategories() {
    const response = await fetch(`${API}/categories`);

    if (!response.ok) {
        throw new Error('Could not load categories.');
    }

    const categories = await response.json();

    categorySelect.innerHTML =
        '<option value="">All Categories</option>';

    categories.forEach(category => {
        const option = document.createElement('option');

        option.value = category;
        option.textContent = category;

        categorySelect.appendChild(option);
    });
}


// ==========================================
// GET SORTING PARAMETERS
// ==========================================

function getSorting() {
    const sort = sortSelect.value;

    switch (sort) {
        case 'price-low':
            return { sort_by: 'price', order: 'asc' };

        case 'price-high':
            return { sort_by: 'price', order: 'desc' };

        case 'name':
            return { sort_by: 'name', order: 'asc' };

        case 'newest':
            return { sort_by: 'id', order: 'desc' };

        default:
            return { sort_by: 'id', order: 'asc' };
    }
}


// ==========================================
// LOAD PRODUCTS FROM FASTAPI
// ==========================================

async function loadProducts() {
    statusEl.textContent = 'Finding your everyday favourites...';

    grid.innerHTML = '';
    pagination.innerHTML = '';

    const params = new URLSearchParams();

    // Search
    if (searchInput.value.trim()) {
        params.set('q', searchInput.value.trim());
    }

    // Category
    if (categorySelect.value) {
        params.set('category', categorySelect.value);
    }

    // Pagination
    params.set('limit', PRODUCTS_PER_PAGE);
    params.set('offset', currentPage * PRODUCTS_PER_PAGE);

    // Sorting
    const sorting = getSorting();

    params.set('sort_by', sorting.sort_by);
    params.set('order', sorting.order);

    const response = await fetch(
        `${API}/products?${params.toString()}`
    );

    if (!response.ok) {
        throw new Error('Could not load products. Please try again.');
    }

    const data = await response.json();

    const products = data.items;

    totalProducts = data.total;

    resultCount.textContent =
        `${totalProducts} ${totalProducts === 1 ? 'product' : 'products'} to discover`;

    statusEl.textContent = '';

    // Empty state
    if (!products.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No matches just yet.</h3>
                <p>Try another search or choose a different category.</p>
            </div>
        `;

        return;
    }

    // Render product cards
    grid.innerHTML = products.map(product => `
        <article
            class="product-card"
            tabindex="0"
            role="button"
            aria-label="View ${escapeHTML(product.name)} details"
            data-id="${product.id}"
        >
            <div class="product-image-wrap">

                <img
                    class="product-image"
                    src="${escapeHTML(product.image_url)}"
                    alt="${escapeHTML(product.name)}"
                    loading="lazy"
                    onerror="this.src='https://placehold.co/600x600/f0efe9/52634d?text=Everyday+Store'"
                />

                <span class="product-category">
                    ${escapeHTML(product.category)}
                </span>

            </div>

            <div class="product-info">

                <div class="product-title-row">
                    <h3 class="product-title">
                        ${escapeHTML(product.name)}
                    </h3>

                    <span class="product-price">
                        ${money(product.price)}
                    </span>
                </div>

                <p class="product-description">
                    ${escapeHTML(product.description)}
                </p>

                <span class="view-details">
                    Discover more ↗
                </span>

            </div>
        </article>
    `).join('');

    // Product details click events
    grid.querySelectorAll('.product-card').forEach(card => {

        card.addEventListener('click', () => {
            showDetails(Number(card.dataset.id));
        });

        card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();

                showDetails(Number(card.dataset.id));
            }
        });

    });

    renderPagination();
}


// ==========================================
// PAGINATION
// ==========================================

function renderPagination() {

    const totalPages = Math.ceil(
        totalProducts / PRODUCTS_PER_PAGE
    );

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    const start = currentPage * PRODUCTS_PER_PAGE + 1;

    const end = Math.min(
        (currentPage + 1) * PRODUCTS_PER_PAGE,
        totalProducts
    );

    pagination.innerHTML = `
        <div class="pagination-info">
            Showing ${start}–${end} of ${totalProducts} products
        </div>

        <div class="pagination-controls">

            <button
                class="page-btn"
                id="prev-page"
                ${currentPage === 0 ? 'disabled' : ''}
            >
                ← Previous
            </button>

            <span class="page-number">
                Page ${currentPage + 1} of ${totalPages}
            </span>

            <button
                class="page-btn"
                id="next-page"
                ${currentPage >= totalPages - 1 ? 'disabled' : ''}
            >
                Next →
            </button>

        </div>
    `;

    document.getElementById('prev-page')
        .addEventListener('click', () => {

            if (currentPage > 0) {
                currentPage--;
                loadProducts().catch(showError);
            }

        });

    document.getElementById('next-page')
        .addEventListener('click', () => {

            if (currentPage < totalPages - 1) {
                currentPage++;
                loadProducts().catch(showError);
            }

        });
}


// ==========================================
// PRODUCT DETAILS
// ==========================================

async function showDetails(id) {

    try {

        const response = await fetch(
            `${API}/products/${id}`
        );

        if (response.status === 404) {
            throw new Error('Product not found.');
        }

        if (!response.ok) {
            throw new Error('Could not load product details.');
        }

        const product = await response.json();

        modalContent.innerHTML = `
            <div class="modal-layout">

                <img
                    src="${escapeHTML(product.image_url)}"
                    alt="${escapeHTML(product.name)}"
                    onerror="this.src='https://placehold.co/600x600/f0efe9/52634d?text=Everyday+Store'"
                />

                <div class="modal-copy">

                    <p class="eyebrow">
                        ${escapeHTML(product.category.toUpperCase())}
                        · PRODUCT ${product.id}
                    </p>

                    <h2 id="modal-title">
                        ${escapeHTML(product.name)}
                    </h2>

                    <div class="modal-price">
                        ${money(product.price)}
                    </div>

                    <p>
                        ${escapeHTML(product.description)}
                    </p>

                    <div class="stock-note">
                        ${
                            product.stock > 0
                                ? `${product.stock} available in stock`
                                : 'Currently out of stock'
                        }
                    </div>

                </div>

            </div>
        `;

        modal.hidden = false;

        document.getElementById('modal-close').focus();

    } catch (error) {

        statusEl.textContent = error.message;

    }

}


// ==========================================
// MODAL CONTROLS
// ==========================================

function closeModal() {
    modal.hidden = true;
}

document.getElementById('modal-close')
    .addEventListener('click', closeModal);

modal.addEventListener('click', event => {

    if (event.target === modal) {
        closeModal();
    }

});

document.addEventListener('keydown', event => {

    if (event.key === 'Escape' && !modal.hidden) {
        closeModal();
    }

});


// ==========================================
// SEARCH
// ==========================================

searchInput.addEventListener('input', () => {

    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {

        currentPage = 0;

        loadProducts().catch(showError);

    }, 350);

});


// ==========================================
// CATEGORY FILTER
// ==========================================

categorySelect.addEventListener('change', () => {

    currentPage = 0;

    loadProducts().catch(showError);

});


// ==========================================
// SORTING
// ==========================================

sortSelect.addEventListener('change', () => {

    currentPage = 0;

    loadProducts().catch(showError);

});


// ==========================================
// ERROR HANDLING
// ==========================================

function showError(error) {

    statusEl.textContent =
        error.message || 'Something went wrong.';

}


// ==========================================
// INITIALISE APPLICATION
// ==========================================

async function start() {

    try {

        statusEl.textContent = 'Loading your store...';

        await loadCategories();

        await loadProducts();

    } catch (error) {

        showError(error);

    }

}

start();
