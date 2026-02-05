const supabaseUrl = 'https://bmmhrilwjgfbcaefguyx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbWhyaWx3amdmYmNhZWZndXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTY3NTMsImV4cCI6MjA4NTY3Mjc1M30.KdBImt3wsO5XgZJqaHh1sfnB1rA3sMUbHOxUQ8Qn5Dk';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');
const categoryButtons = document.querySelectorAll('.cat-btn');
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
const tierMeSelect = document.getElementById('tier-me');
const tierPartnerSelect = document.getElementById('tier-partner');

const API_KEY = '025ca0b1f29347fb2fcd2d4d23cffc18';
const GROUP_ID = sessionStorage.getItem('appGroupId');
let currentCategory = '전체';
let lastResults = [];
let currentMovieData = {};

document.addEventListener('DOMContentLoaded', () => {
    if (!GROUP_ID) {
        document.body.innerHTML = '';
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
        fetchMovies(searchTerm);
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

async function fetchCredits(mediaType, id) {
    const url = 'https://api.themoviedb.org/3/' + mediaType + '/' + id + '/credits?api_key=' + API_KEY + '&language=ko-KR';
    try {
        const response = await fetch(url);
        if (!response.ok) return { director: '정보 없음', cast: '정보 없음' };
        const data = await response.json();
        const director = data.crew?.find(p => p.job === 'Director')?.name || data.created_by?.[0]?.name || '정보 없음';
        const cast = data.cast?.slice(0, 5).map(p => p.name).join(', ') || '정보 없음';
        return { director, cast };
    } catch (e) { return { director: '정보 없음', cast: '정보 없음' }; }
}

async function fetchMovies(query) {
    if (recentSearchesContainer) recentSearchesContainer.style.display = 'none';
    if (resultsSection) resultsSection.innerHTML = '<p class="loading">검색 중...</p>';
    const url = 'https://api.themoviedb.org/3/search/multi?api_key=' + API_KEY + '&language=ko-KR&query=' + query;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API 요청 실패');
        const data = await response.json();
        lastResults = data.results;
        await displayResults();
    } catch (e) {
        if (resultsSection) resultsSection.innerHTML = '<p class="no-results">오류가 발생했습니다.</p>';
    }
}

async function fetchItemDetails(mediaType, id) {
    const url = 'https://api.themoviedb.org/3/' + mediaType + '/' + id + '?api_key=' + API_KEY + '&language=ko-KR';
    try {
        const response = await fetch(url);
        return response.ok ? response.json() : null;
    } catch (e) { return null; }
}

const filterItem = (item) => {
    const isAnimation = item.genre_ids?.includes(16);
    if (!item.media_type) return false;
    switch (currentCategory) {
        case '전체': return true;
        case '영화': return item.media_type === 'movie' && !isAnimation;
        case '드라마': return item.media_type === 'tv' && !isAnimation;
        case '애니메이션': return isAnimation;
        default: return false;
    }
};

async function displayResults() {
    if (!resultsSection) return;
    resultsSection.innerHTML = '';
    const displayedMovieIds = new Set();
    const itemsToDisplay = [];
    lastResults.forEach(item => {
        if (item.media_type === 'person') {
            item.known_for?.forEach(work => {
                if (work.media_type && !displayedMovieIds.has(work.id) && filterItem(work)) {
                    itemsToDisplay.push(work);
                    displayedMovieIds.add(work.id);
                }
            });
        } else if ((item.media_type === 'movie' || item.media_type === 'tv') && !displayedMovieIds.has(item.id) && filterItem(item)) {
            itemsToDisplay.push(item);
            displayedMovieIds.add(item.id);
        }
    });

    if (itemsToDisplay.length === 0) {
        resultsSection.innerHTML = '<p class="no-results">표시할 결과가 없습니다.</p>';
        return;
    }
    const cardPromises = itemsToDisplay.map(item => createCardHTML(item));
    const cardsHTML = (await Promise.all(cardPromises)).join('');
    resultsSection.innerHTML = cardsHTML;
    
    await markWishlistedItems();
}

async function createCardHTML(item) {
    const credits = await fetchCredits(item.media_type, item.id);
    const title = item.title || item.name;
    const posterPath = item.poster_path ? 'https://image.tmdb.org/t/p/w500' + item.poster_path : 'https://placehold.co/500x750?text=No+Image';
    return '<div class="movie-card" data-id="' + item.id + '" data-type="' + item.media_type + '">' +
        '<div class="movie-card-poster">' +
        '<img src="' + posterPath + '" alt="' + title + ' 포스터">' +
        '<button class="wishlist-btn" data-id="' + item.id + '" data-type="' + item.media_type + '" title="위시리스트에 추가">' +
        '<span class="material-symbols-outlined">favorite</span>' +
        '</button>' +
        '</div>' +
        '<div class="movie-info">' +
        '<h3>' + title + '</h3>' +
        '<div class="credits-info">' +
        '<span><strong>감독:</strong> ' + credits.director + '</span>' +
        '<span><strong>출연:</strong> ' + credits.cast + '</span>' +
        '</div>' +
        '</div>' +
        '</div>';
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
    
    let content = null;
    for (const item of lastResults) {
        if (item.id?.toString() === contentId) {
            content = item;
            break;
        }
        if (item.media_type === 'person' && item.known_for) {
            const found = item.known_for.find(w => w.id?.toString() === contentId);
            if (found) {
                content = found;
                break;
            }
        }
    }
    
    if (!content) return;
    
    const title = content.title || content.name;
    const image = content.poster_path ? 'https://image.tmdb.org/t/p/w500' + content.poster_path : '';
    
    const { data: existingList } = await supabaseClient
        .from('wishlists')
        .select('id')
        .eq('content_id', contentId)
        .eq('group_id', GROUP_ID);
    
    const existing = existingList && existingList.length > 0 ? existingList[0] : null;
    
    if (existing) {
        await supabaseClient
            .from('wishlists')
            .delete()
            .match({ content_id: contentId, group_id: GROUP_ID });
        
        btn.classList.remove('active');
        alert('위시리스트에서 제거되었습니다.');
    } else {
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

if (categoryButtons) {
    categoryButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            currentCategory = event.target.textContent;
            if (lastResults.length > 0) displayResults();
        });
    });
}

function saveRecentSearch(term) {
    try {
        let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
        searches = searches.filter(s => s.toLowerCase() !== term.toLowerCase());
        searches.unshift(term);
        localStorage.setItem('recentSearches', JSON.stringify(searches.slice(0, 10)));
    } catch (e) { console.error("최근 검색어 저장 실패:", e); }
}

function displayRecentSearches() {
    if (!recentSearchesContainer || !recentSearchesList) return;
    try {
        const searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
        if (searches.length > 0) {
            recentSearchesList.innerHTML = searches.map(term => '<span class="recent-search-item"><span>' + term + '</span><button class="delete-search-btn" data-term="' + term + '">&times;</button></span>').join('');
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
            let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
            searches = searches.filter(s => s !== termToDelete);
            localStorage.setItem('recentSearches', JSON.stringify(searches));
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
        const wishlistBtn = event.target.closest('.wishlist-btn');
        if (wishlistBtn) {
            event.stopPropagation();
            await handleWishlistClick(wishlistBtn);
            return;
        }
        
        const card = event.target.closest('.movie-card');
        if (card) {
            const movieId = card.dataset.id;
            const mediaType = card.dataset.type;
            const details = await fetchItemDetails(mediaType, movieId);
            if (!details) { alert('상세 정보를 불러오는 데 실패했습니다.'); return; }
            currentMovieData = { ...details, media_type: mediaType };
            await displayDetailsView();
            if (modalOverlay) modalOverlay.classList.add('visible');
        }
    });
}

async function displayDetailsView() {
    const posterPath = currentMovieData.poster_path ? 'https://image.tmdb.org/t/p/w500' + currentMovieData.poster_path : 'https://placehold.co/500x750?text=No+Image';
    const credits = await fetchCredits(currentMovieData.media_type, currentMovieData.id);
    if (modalPoster) modalPoster.src = posterPath;
    if (modalTitle) modalTitle.textContent = currentMovieData.title || currentMovieData.name;
    if (modalCredits) modalCredits.innerHTML = '<p><strong>감독:</strong> ' + credits.director + '</p><p><strong>출연:</strong> ' + credits.cast + '</p>';
    if (modalOverview) modalOverview.textContent = currentMovieData.overview || '줄거리 정보가 없습니다.';
    if (detailsView) detailsView.style.display = 'block';
    if (reviewView) reviewView.style.display = 'none';
}

if (showReviewViewBtn) {
    showReviewViewBtn.addEventListener('click', async () => {
        const title = currentMovieData.title || currentMovieData.name;
        const id = currentMovieData.id;
        if (reviewModalTitle) reviewModalTitle.textContent = title + ' - 리뷰';
        
        const { data } = await supabaseClient
            .from('reviews')
            .select('review_text, tier_me, tier_partner')
            .eq('movie_id', id)
            .eq('group_id', GROUP_ID);
        
        const review = data && data.length > 0 ? data[0] : null;
        
        if (reviewTextarea) reviewTextarea.value = review?.review_text || '';
        if (tierMeSelect) tierMeSelect.value = review?.tier_me || '';
        if (tierPartnerSelect) tierPartnerSelect.value = review?.tier_partner || '';
        
        if (reviewTextarea) reviewTextarea.focus();
        if (detailsView) detailsView.style.display = 'none';
        if (reviewView) reviewView.style.display = 'block';
    });
}

if (reviewTextarea) {
    reviewTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (saveButton) saveButton.click();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            if (backToDetailsBtn) backToDetailsBtn.click();
        }
    });
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (modalOverlay && modalOverlay.classList.contains('visible')) {
            closeModal();
        }
    }
});

if (backToDetailsBtn) {
    backToDetailsBtn.addEventListener('click', () => {
        if (detailsView) detailsView.style.display = 'block';
        if (reviewView) reviewView.style.display = 'none';
    });
}

if (saveButton) {
    saveButton.addEventListener('click', async () => {
        const id = currentMovieData.id;
        const media_type = currentMovieData.media_type;
        const title = currentMovieData.title || currentMovieData.name;
        const poster_path = currentMovieData.poster_path;
        const reviewText = reviewTextarea.value.trim();
        const tierMe = tierMeSelect ? tierMeSelect.value : null;
        const tierPartner = tierPartnerSelect ? tierPartnerSelect.value : null;
        
        const reviewData = { 
            movie_id: id, 
            media_type: media_type, 
            review_text: reviewText, 
            group_id: GROUP_ID,
            content_title: title,
            content_image: poster_path ? 'https://image.tmdb.org/t/p/w500' + poster_path : '',
            tier_me: tierMe || null,
            tier_partner: tierPartner || null
        };
        
        if (reviewText || tierMe || tierPartner) {
            const { error } = await supabaseClient.from('reviews').upsert(reviewData, { onConflict: 'movie_id, group_id' });
            if (error) alert('리뷰 저장 실패: ' + error.message);
            else alert('저장되었습니다!');
        } else {
            const { error } = await supabaseClient.from('reviews').delete().match({ movie_id: id, group_id: GROUP_ID });
            if (error) alert('삭제 실패: ' + error.message);
            else alert('삭제되었습니다.');
        }
        if (backToDetailsBtn) backToDetailsBtn.click();
    });
}