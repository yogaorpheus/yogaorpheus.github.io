// post.js - Post detail page with API integration

// DOM Elements
const loadingSpinner = document.getElementById('loadingSpinner');
const postContainer = document.getElementById('postContainer');
const commentsSection = document.getElementById('commentsSection');
const commentsContainer = document.getElementById('commentsContainer');
const errorMessage = document.getElementById('errorMessage');

// Get post ID from URL
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (!postId) {
        showError('No post ID provided');
        return;
    }

    fetchPostDetails();
});

// Fetch post details and comments
async function fetchPostDetails() {
    try {
        showLoading(true);

        // Fetch post details and comments in parallel
        const [postResponse, commentsResponse] = await Promise.all([
            fetch(`https://dummyjson.com/posts/${postId}`),
            fetch(`https://dummyjson.com/posts/${postId}/comments`)
        ]);

        const post = await postResponse.json();
        const commentsData = await commentsResponse.json();

        displayPost(post);
        displayComments(commentsData.comments);
        showLoading(false);

    } catch (error) {
        console.error('Error fetching post details:', error);
        showError('Failed to load post details. Please try again later.');
    }
}

// Display post details
function displayPost(post) {
    postContainer.style.display = 'block';

    // Get saved state to pass back
    const savedState = sessionStorage.getItem('blogSearchState');
    let backUrl = 'index.html';

    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            // We'll use session storage for restoration, so just link to index
            backUrl = 'index.html';
        } catch (e) {}
    }

    postContainer.innerHTML = `
        <div class="card-body">
            <h2 class="card-title mb-3">${post.title}</h2>

            <div class="d-flex flex-wrap gap-3 mb-4">
                <span class="badge bg-primary">
                    <i class="fas fa-user me-1"></i>User #${post.userId}
                </span>
                <span class="badge bg-secondary">
                    <i class="fas fa-eye me-1"></i>${post.views} views
                </span>
                <span class="badge bg-success">
                    <i class="fas fa-heart me-1"></i>${post.reactions.likes} likes
                </span>
                <span class="badge bg-danger">
                    <i class="fas fa-thumbs-down me-1"></i>${post.reactions.dislikes} dislikes
                </span>
            </div>

            <div class="mb-3">
                ${post.tags.map(tag => `<span class="badge bg-info text-white me-1">#${tag}</span>`).join('')}
            </div>

            <hr>

            <div class="post-content">
                <p class="lead">${post.body.substring(0, 100)}...</p>
                <p>${post.body}</p>
            </div>
        </div>
        <div class="card-footer bg-white d-flex justify-content-between align-items-center">
            <a href="${backUrl}" class="btn btn-primary" id="backToPostsBtn">
                <i class="fas fa-arrow-left me-2"></i>Back to Posts
            </a>
            ${savedState ? '<small class="text-muted">Returning to your search results</small>' : ''}
        </div>
    `;
}

// Display comments
function displayComments(comments) {
    if (!comments || comments.length === 0) {
        return;
    }

    commentsSection.style.display = 'block';

    let commentsHTML = '';
    comments.forEach(comment => {
        commentsHTML += `
            <div class="card mb-2">
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-1">${comment.user.fullName}</h6>
                        <small class="text-muted">
                            <i class="fas fa-heart text-danger me-1"></i>${comment.likes}
                        </small>
                    </div>
                    <p class="mb-0 small">${comment.body}</p>
                    <small class="text-muted">@${comment.user.username}</small>
                </div>
            </div>
        `;
    });

    commentsContainer.innerHTML = commentsHTML;
}

// Optional: Clear state when explicitly going to home
document.addEventListener('click', function(e) {
    if (e.target.closest('.navbar-brand')) {
        sessionStorage.removeItem('blogSearchState');
    }
});

// Helper functions
function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
    if (show) {
        postContainer.style.display = 'none';
        commentsSection.style.display = 'none';
        errorMessage.style.display = 'none';
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    loadingSpinner.style.display = 'none';
    postContainer.style.display = 'none';
    commentsSection.style.display = 'none';
}