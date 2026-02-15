// script.js - Main functionality with DummyJSON API

const POSTS_PER_PAGE = 2;
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

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    fetchAllPosts();
    setupSearch();
});

// Fetch all posts from API
async function fetchAllPosts() {
    try {
        showLoading(true);

        // First, get total count
        const initialResponse = await fetch('https://dummyjson.com/posts?limit=1');
        const initialData = await initialResponse.json();
        totalPosts = initialData.total;

        // Fetch all posts (API returns max 30 per request, but we'll get first 30)
        // For more posts, you'd need to implement pagination through API
        const response = await fetch('https://dummyjson.com/posts?limit=30');
        const data = await response.json();

        allPosts = data.posts;
        filteredPosts = [...allPosts];

        displayPosts();
        showLoading(false);

    } catch (error) {
        console.error('Error fetching posts:', error);
        showError('Failed to load posts. Please try again later.');
    }
}

// Setup search functionality
function setupSearch() {
    let searchTimeout;

    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const searchTerm = e.target.value.toLowerCase().trim();

        // Debounce search to avoid too many API calls
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

// Search posts via API
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
        console.error('Error searching posts:', error);
        showError('Search failed. Showing local results.');

        // Fallback to local filtering
        filteredPosts = allPosts.filter(post =>
            post.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        currentPage = 1;
        displayPosts();
        showLoading(false);
    }
}

// Display posts for current page
function displayPosts() {
    const totalFilteredPosts = filteredPosts.length;
    const totalPages = Math.ceil(totalFilteredPosts / POSTS_PER_PAGE);
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const endIndex = Math.min(startIndex + POSTS_PER_PAGE, totalFilteredPosts);
    const postsToShow = filteredPosts.slice(startIndex, endIndex);

    // Show/hide elements
    if (totalFilteredPosts === 0) {
        postsContainer.style.display = 'none';
        paginationContainer.style.display = 'none';
        noResults.style.display = 'block';
        errorMessage.style.display = 'none';
        return;
    } else {
        postsContainer.style.display = 'flex';
        paginationContainer.style.display = 'block';
        noResults.style.display = 'none';
        errorMessage.style.display = 'none';
    }

    // Generate posts HTML
    let postsHTML = '';
    postsToShow.forEach(post => {
        // Truncate body to 100 characters for excerpt
        const excerpt = post.body.length > 100
            ? post.body.substring(0, 100) + '...'
            : post.body;

        postsHTML += `
            <div class="col-md-6 mb-4">
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

    // Generate pagination
    generatePagination(totalPages);
}

// Generate pagination controls
function generatePagination(totalPages) {
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

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;

    paginationEl.innerHTML = paginationHTML;
}

// Change page function
window.changePage = function(page) {
    currentPage = page;
    displayPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Helper functions
function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
    if (show) {
        postsContainer.style.display = 'none';
        paginationContainer.style.display = 'none';
        noResults.style.display = 'none';
        errorMessage.style.display = 'none';
    }
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    loadingSpinner.style.display = 'none';
    postsContainer.style.display = 'none';
    paginationContainer.style.display = 'none';
    noResults.style.display = 'none';
}