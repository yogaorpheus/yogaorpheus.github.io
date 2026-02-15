// script.js - Main functionality with DummyJSON API

const POSTS_PER_PAGE = 3;
let currentPage = 1;
let allPosts = [];
let filteredPosts = [];
let totalPosts = 0;

// DOM Elements
const postsContainer = document.getElementById('postsContainer');
const paginationEl = document.getElementById('pagination');
const paginationContainer = document.getElementById('paginationContainer');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const loadingSpinner = document.getElementById('loadingSpinner');
const noResults = document.getElementById('noResults');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

const MAX_VISIBLE_PAGES = 5;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    fetchAllPosts();
    setupSearch();
});

// Fetch all posts - FIXED: DummyJSON max limit is 30 per request
async function fetchAllPosts() {
    try {
        showLoading(true);

        // First get total count
        const initialResponse = await fetch('https://dummyjson.com/posts?limit=0');
        const initialData = await initialResponse.json();
        totalPosts = initialData.total; // This gives 251

        // DummyJSON only returns max 30 items per request
        // So we need to get first 30 posts
        const response = await fetch('https://dummyjson.com/posts?limit='+totalPosts);
        const data = await response.json();

        allPosts = data.posts;
        filteredPosts = [...allPosts];

        console.log('Posts loaded:', allPosts.length); // Should show 30

        displayPosts();
        showLoading(false);

    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load posts');
    }
}

// Search function - FIXED: Proper error handling
async function searchPosts(searchTerm) {
    try {
        showLoading(true);

        const response = await fetch(`https://dummyjson.com/posts/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();

        filteredPosts = data.posts;
        currentPage = 1;
        displayPosts();
        showLoading(false);

    } catch (error) {
        console.error('Search error:', error);
        // Fallback to local filtering
        filteredPosts = allPosts.filter(post =>
            post.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        currentPage = 1;
        displayPosts();
        showLoading(false);
    }
}

// Setup search
function setupSearch() {
    let searchTimeout;

    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const searchTerm = e.target.value.toLowerCase().trim();

        searchTimeout = setTimeout(() => {
            if (searchTerm === '') {
                filteredPosts = [...allPosts];
                currentPage = 1;
                displayPosts();
            } else {
                searchPosts(searchTerm);
            }
        }, 300);
    });

    clearSearch.addEventListener('click', function() {
        searchInput.value = '';
        filteredPosts = [...allPosts];
        currentPage = 1;
        displayPosts();
    });
}

// Display posts - FIXED: Added null checks
function displayPosts() {
    if (!filteredPosts || filteredPosts.length === 0) {
        postsContainer.style.display = 'none';
        paginationContainer.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    const totalFilteredPosts = filteredPosts.length;
    const totalPages = Math.ceil(totalFilteredPosts / POSTS_PER_PAGE);

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const endIndex = Math.min(startIndex + POSTS_PER_PAGE, totalFilteredPosts);
    const postsToShow = filteredPosts.slice(startIndex, endIndex);

    postsContainer.style.display = 'flex';
    paginationContainer.style.display = 'block';
    noResults.style.display = 'none';
    errorMessage.style.display = 'none';

    let postsHTML = '';
    postsToShow.forEach(post => {
        const excerpt = post.body.length > 100
            ? post.body.substring(0, 100) + '...'
            : post.body;

        postsHTML += `
            <div class="col-md-4 mb-4">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}</h5>
                        <p class="card-text text-muted">${excerpt}</p>

                        <div class="d-flex flex-wrap gap-2 mb-3">
                            <span class="badge bg-primary">
                                <i class="fas fa-user me-1"></i>User #${post.userId}
                            </span>
                            <span class="badge bg-secondary">
                                <i class="fas fa-eye me-1"></i>${post.views} views
                            </span>
                            <span class="badge bg-info">
                                <i class="fas fa-heart me-1"></i>${post.reactions.likes} likes
                            </span>
                        </div>

                        <div class="mb-3">
                            ${post.tags.map(tag => `<span class="badge bg-light text-dark me-1">#${tag}</span>`).join('')}
                        </div>

                        <a href="post.html?id=${post.id}" class="btn btn-outline-primary btn-sm">
                            Read More <i class="fas fa-arrow-right ms-1"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    });

    postsContainer.innerHTML = postsHTML;
    generateSmartPagination(totalPages);
}

// Smart pagination
function generateSmartPagination(totalPages) {
    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;

    let startPage = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
    let endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);

    if (endPage - startPage + 1 < MAX_VISIBLE_PAGES) {
        startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
    }

    if (startPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(1); return false;">1</a>
            </li>
        `;
        if (startPage > 2) {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${totalPages}); return false;">${totalPages}</a>
            </li>
        `;
    }

    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;

    paginationEl.innerHTML = paginationHTML;
}

// Change page
window.changePage = function(page) {
    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentPage = page;
    displayPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Helper functions
function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    loadingSpinner.style.display = 'none';
    postsContainer.style.display = 'none';
    paginationContainer.style.display = 'none';
    noResults.style.display = 'none';
}