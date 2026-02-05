const supabaseUrl = 'https://bmmhrilwjgfbcaefguyx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbWhyaWx3amdmYmNhZWZndXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTY3NTMsImV4cCI6MjA4NTY3Mjc1M30.KdBImt3wsO5XgZJqaHh1sfnB1rA3sMUbHOxUQ8Qn5Dk';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');
const resultsSection = document.getElementById('home-results');
const modalOverlay = document.querySelector('.modal-overlay');
const closeButton = document.querySelector('.close-button');
const detailsView = document.getElementById('details-view');
const modalPoster = document.getElementById('modal-poster');
const modalTitle = document.getElementById('modal-title');
const modalCredits = document.getElementById('modal-credits');
const modalOverview = document.getElementById('modal-overview');
const showReviewViewBtn = document.getElementById('show-review-view-btn');
const reviewView = document.getElementById('review-view');
const reviewModalTitle = document.getElementById('review-modal-title');
const reviewTextarea = document.getElementById('review-textarea');
const backToDetailsBtn = document.getElementById('back-to-details-btn');
const saveButton = document.getElementById('save-button');
const recentSearchesContainer = document.getElementById('recent-searches-container');
const recentSearchesList = document.getElementById('recent-searches-list');
const logoutButton = document.getElementById('logout-button');

const GROUP_ID = sessionStorage.getItem('appGroupId');
// Use relative path for the proxy API
const PROXY_URL = 'https://suniverse-api-ew8y.vercel.app/api/books';
let lastResults = [];
let currentBookData = {};

document.addEventListener('DOMContentLoaded', () => {
    if (!GROUP_ID) {
        location.href = 'index.html';
        return;
    }
    displayRecentSearches();
});

if (searchButton && searchInput) {
    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm === '') { return alert('검색어를 입력해주세요!'); }
        saveRecentSearch(searchTerm);
        fetchBooks(searchTerm);
    });
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && searchButton) { searchButton.click(); }
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        sessionStorage.clear();
        alert('로그아웃되었습니다.');
        location.href = 'index.html';
    });
}

async function fetchBooks(query) {
    if (recentSearchesContainer) recentSearchesContainer.style.display = 'none';
    if (resultsSection) resultsSection.innerHTML = '<p class="loading">검색 중...</p>';

    try {
        // Construct standard URL for proxy
        const url = `${PROXY_URL}?query=${encodeURIComponent(query)}&display=20`;
        console.log('Fetching:', url);

        const response = await fetch(url);

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        // Naver API returns 'items' array. Handle possible empty/undefined cases.
        lastResults = data.items || [];
        displayResults();
    } catch (e) {
        console.error('Fetch error:', e);
        if (resultsSection) {
            resultsSection.innerHTML = `<p class="no-results">오류가 발생했습니다: ${e.message}</p>`;
        }
    }
}

async function displayResults() {
    if (!resultsSection) return;
    resultsSection.innerHTML = '';

    if (lastResults.length === 0) {
        resultsSection.innerHTML = '<p class="no-results">검색 결과가 없습니다.</p>';
        return;
    }

    const cardsHTML = lastResults.map(book => createCardHTML(book)).join('');
    resultsSection.innerHTML = cardsHTML;
    
    // 위시리스트에 있는 항목 표시
    await markWishlistedItems();
}

async function markWishlistedItems() {
    const { data: wishlists } = await supabaseClient
        .from('wishlists')
        .select('content_id')
        .eq('group_id', GROUP_ID);
    
    const wishlistedIds = wishlists?.map(w => w.content_id) || [];
    
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        if (wishlistedIds.includes(btn.dataset.id)) {
            btn.classList.add('active');
        }
    });
}

async function handleWishlistClick(btn) {
    const contentId = btn.dataset.id;
    const mediaType = btn.dataset.type;
    
    // lastResults에서 해당 책 찾기
    const book = lastResults.find(b => b.isbn.split(' ')[0] === contentId);
    
    if (!book) return;
    
    const title = stripHtml(book.title);
    const image = book.image || '';
    
// 이미 위시리스트에 있는지 확인
    const { data: existingList } = await supabaseClient
        .from('wishlists')
        .select('id')
        .eq('content_id', contentId)
        .eq('group_id', GROUP_ID);
    
    const existing = existingList && existingList.length > 0 ? existingList[0] : null;
    
    if (existing) {
        // 위시리스트에서 제거
        await supabaseClient
            .from('wishlists')
            .delete()
            .match({ content_id: contentId, group_id: GROUP_ID });
        
        btn.classList.remove('active');
        alert('위시리스트에서 제거되었습니다.');
    } else {
        // 위시리스트에 추가
        await supabaseClient
            .from('wishlists')
            .insert({
                content_id: contentId,
                media_type: mediaType,
                content_title: title,
                content_image: image,
                group_id: GROUP_ID
            });
        
        btn.classList.add('active');
        alert('위시리스트에 추가되었습니다!');
    }
}

function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

function createCardHTML(book) {
    const title = stripHtml(book.title);
    const image = book.image || 'https://placehold.co/150x220?text=No+Image';
    const author = stripHtml(book.author);
    const publisher = stripHtml(book.publisher);

    // Use isbn as unique ID
    const bookId = book.isbn.split(' ')[0];

    return `
        <div class="movie-card" data-isbn="${bookId}">
            <div class="movie-card-poster">
                <img src="${image}" alt="${title} 표지">
                <button class="wishlist-btn" data-id="${bookId}" data-type="book" title="위시리스트에 추가">
                    <span class="material-symbols-outlined">favorite</span>
                </button>
            </div>
            <div class="movie-info">
                <h3>${title}</h3>
                <div class="credits-info">
                    <span><strong>저자:</strong> ${author}</span>
                    <span><strong>출판사:</strong> ${publisher}</span>
                </div>
            </div>
        </div>
    `;
}

function saveRecentSearch(term) {
    try {
        let searches = JSON.parse(localStorage.getItem('recentBookSearches')) || [];
        searches = searches.filter(s => s.toLowerCase() !== term.toLowerCase());
        searches.unshift(term);
        localStorage.setItem('recentBookSearches', JSON.stringify(searches.slice(0, 10)));
    } catch (e) { console.error("최근 검색어 저장 실패:", e); }
}

function displayRecentSearches() {
    if (!recentSearchesContainer || !recentSearchesList) return;
    try {
        const searches = JSON.parse(localStorage.getItem('recentBookSearches')) || [];
        if (searches.length > 0) {
            recentSearchesList.innerHTML = searches.map(term => `<span class="recent-search-item"><span>${term}</span><button class="delete-search-btn" data-term="${term}">&times;</button></span>`).join('');
            recentSearchesContainer.style.display = 'block';
        } else {
            recentSearchesContainer.style.display = 'none';
        }
    } catch (e) { console.error("최근 검색어 표시 실패:", e); }
}

if (recentSearchesList) {
    recentSearchesList.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('delete-search-btn')) {
            const termToDelete = target.dataset.term;
            let searches = JSON.parse(localStorage.getItem('recentBookSearches')) || [];
            searches = searches.filter(s => s !== termToDelete);
            localStorage.setItem('recentBookSearches', JSON.stringify(searches));
            displayRecentSearches();
        } else if (target.closest('.recent-search-item')) {
            const searchTerm = target.closest('.recent-search-item').querySelector('span').textContent;
            if (searchInput) searchInput.value = searchTerm;
            if (searchButton) searchButton.click();
        }
    });
}

function closeModal() { if (modalOverlay) modalOverlay.classList.remove('visible'); }
if (closeButton) closeButton.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

if (resultsSection) {
    resultsSection.addEventListener('click', async (event) => {
        // 하트 버튼 클릭 처리
        const wishlistBtn = event.target.closest('.wishlist-btn');
        if (wishlistBtn) {
            event.stopPropagation();
            await handleWishlistClick(wishlistBtn);
            return;
        }
        
        // 카드 클릭 처리 (모달 열기)
        const card = event.target.closest('.movie-card');
        if (card) {
            const bookId = card.dataset.isbn;
            const book = lastResults.find(b => b.isbn.startsWith(bookId) || b.isbn === bookId);

            if (!book) { alert('상세 정보를 불러오는 데 실패했습니다.'); return; }
            currentBookData = book;
            displayDetailsView();
            if (modalOverlay) modalOverlay.classList.add('visible');
        }
    });
}

function displayDetailsView() {
    const title = stripHtml(currentBookData.title);
    const image = currentBookData.image || 'https://placehold.co/300x450?text=No+Image';
    const author = stripHtml(currentBookData.author);
    const publisher = stripHtml(currentBookData.publisher);
    const description = stripHtml(currentBookData.description || '책 소개가 없습니다.');

    if (modalPoster) modalPoster.src = image;
    if (modalTitle) modalTitle.textContent = title;
    if (modalCredits) modalCredits.innerHTML = `<p><strong>저자:</strong> ${author}</p><p><strong>출판사:</strong> ${publisher}</p>`;
    if (modalOverview) modalOverview.textContent = description;
    if (detailsView) detailsView.style.display = 'block';
    if (reviewView) reviewView.style.display = 'none';
}

if (showReviewViewBtn) {
    showReviewViewBtn.addEventListener('click', async () => {
        const title = stripHtml(currentBookData.title);
        // Use first part of ISBN as stored ID
        const bookId = currentBookData.isbn.split(' ')[0];

        if (reviewModalTitle) reviewModalTitle.textContent = `${title} - 리뷰`;

        const { data } = await supabaseClient.from('reviews')
            .select('review_text')
            .match({ movie_id: bookId, group_id: GROUP_ID }) // Using movie_id column for book ID to reuse table
            .single();

        if (reviewTextarea) {
            reviewTextarea.value = data?.review_text || '';
            reviewTextarea.focus();
        }

        if (detailsView) detailsView.style.display = 'none';
        if (reviewView) reviewView.style.display = 'block';
    });
}

if (backToDetailsBtn) {
    backToDetailsBtn.addEventListener('click', () => {
        if (detailsView) detailsView.style.display = 'block';
        if (reviewView) reviewView.style.display = 'none';
    });
}

if (saveButton) {
    saveButton.addEventListener('click', async () => {
        const bookId = currentBookData.isbn.split(' ')[0];
        const reviewText = reviewTextarea.value.trim();
        const bookTitle = stripHtml(currentBookData.title);
        const bookImage = currentBookData.image || '';
        
        const reviewData = {
            movie_id: bookId,
            media_type: 'book',
            review_text: reviewText,
            group_id: GROUP_ID,
            content_title: bookTitle,
            content_image: bookImage
        };

        if (reviewText) {
            const { error } = await supabaseClient.from('reviews')
                .upsert(reviewData, { onConflict: 'movie_id, group_id' });

            if (error) alert('리뷰 저장 실패: ' + error.message);
            else alert('리뷰가 저장되었습니다!');
        } else {
            const { error } = await supabaseClient.from('reviews')
                .delete()
                .match({ movie_id: bookId, group_id: GROUP_ID });

            if (error) alert('리뷰 삭제 실패: ' + error.message);
            else alert('리뷰가 삭제되었습니다.');
        }
        if (backToDetailsBtn) backToDetailsBtn.click();
    });
}

// Global ESC key to close modal (Issue 1)
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (modalOverlay && modalOverlay.classList.contains('visible')) {
            closeModal();
        }
    }
});

// Keyboard shortcuts for review textarea
if (reviewTextarea) {
    reviewTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (saveButton) saveButton.click();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            if (backToDetailsBtn) backToDetailsBtn.click();
            else closeModal();
        }
    });
}
