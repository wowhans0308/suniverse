const supabaseUrl = 'https://bmmhrilwjgfbcaefguyx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbWhyaWx3amdmYmNhZWZndXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTY3NTMsImV4cCI6MjA4NTY3Mjc1M30.KdBImt3wsO5XgZJqaHh1sfnB1rA3sMUbHOxUQ8Qn5Dk'; 
const { createClient } = supabase; // Supabase 라이브러리에서 createClient 함수를 가져옵니다.
const supabaseClient = createClient(supabaseUrl, supabaseKey); // 가져온 함수를 사용합니다.

// --- 1. 요소 선택 ---
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

// --- 2. 전역 변수 ---
const API_KEY = '025ca0b1f29347fb2fcd2d4d23cffc18';
let currentCategory = '전체';
let lastResults = [];
let currentMovieData = {};

// --- 3. 인증 및 초기화 ---
(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        location.href = 'login.html'; // 로그인 안되어 있으면 로그인 페이지로
        return;
    }
    displayRecentSearches();
})();


// --- 4. 이벤트 리스너 ---
if (searchButton && searchInput) {
    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm === '') { return alert('검색어를 입력해주세요!'); }
        saveRecentSearch(searchTerm);
        fetchMovies(searchTerm);
    });
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { searchButton.click(); }
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        await supabase.auth.signOut();
        alert('로그아웃되었습니다.');
        location.href = 'index.html';
    });
}

// --- 5. API 호출 함수 ---
async function fetchCredits(mediaType, id) {
    const url = `https://api.themoviedb.org/3/${mediaType}/${id}/credits?api_key=${API_KEY}&language=ko-KR`;
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
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=ko-KR&query=${query}`;
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
    const url = `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${API_KEY}&language=ko-KR`;
    try {
        const response = await fetch(url);
        return response.ok ? response.json() : null;
    } catch (e) { return null; }
}

// --- 6. 화면 표시 및 필터링 함수 ---
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
    const itemsToDisplay = [];
    const displayedMovieIds = new Set();
    
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
}

async function createCardHTML(item) {
    const credits = await fetchCredits(item.media_type, item.id);
    const title = item.title || item.name;
    const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    return `<div class="movie-card" data-id="${item.id}" data-type="${item.media_type}"><div class="movie-card-poster"><img src="${posterPath}" alt="${title} 포스터"></div><div class="movie-info"><h3>${title}</h3><div class="credits-info"><span><strong>감독:</strong> ${credits.director}</span><span><strong>출연:</strong> ${credits.cast}</span></div></div></div>`;
}

// --- 7. 기타 UI 기능 ---
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

// --- 8. 모달 기능 ---
function closeModal() { if (modalOverlay) modalOverlay.classList.remove('visible'); }

if (closeButton) closeButton.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

if (resultsSection) {
    resultsSection.addEventListener('click', async (event) => {
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
    const { poster_path, title, name, id, media_type, overview } = currentMovieData;
    const posterPath = poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    const credits = await fetchCredits(media_type, id);
    if(modalPoster) modalPoster.src = posterPath;
    if(modalTitle) modalTitle.textContent = title || name;
    if(modalCredits) modalCredits.innerHTML = `<p><strong>감독:</strong> ${credits.director}</p><p><strong>출연:</strong> ${credits.cast}</p>`;
    if(modalOverview) modalOverview.textContent = overview || '줄거리 정보가 없습니다.';
    if(detailsView) detailsView.style.display = 'block';
    if(reviewView) reviewView.style.display = 'none';
}

if (showReviewViewBtn) {
    showReviewViewBtn.addEventListener('click', async () => {
        const { title, name, id } = currentMovieData;
        if (reviewModalTitle) reviewModalTitle.textContent = `${title || name} - 리뷰`;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('reviews').select('review_text').match({ movie_id: id, user_id: user.id }).single();
        if (reviewTextarea) reviewTextarea.value = data?.review_text || '';
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
        const { id, media_type } = currentMovieData;
        const reviewText = reviewTextarea.value.trim();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alert('세션이 만료되었습니다. 다시 로그인해주세요.');

        const reviewData = { movie_id: id, media_type, review_text: reviewText, user_id: user.id };
        
        if (reviewText) {
            const { error } = await supabase.from('reviews').upsert(reviewData, { onConflict: 'movie_id, user_id' });
            if (error) alert('리뷰 저장 실패: ' + error.message);
            else alert('리뷰가 저장되었습니다!');
        } else {
            const { error } = await supabase.from('reviews').delete().match({ movie_id: id, user_id: user.id });
            if (error) alert('리뷰 삭제 실패: ' + error.message);
            else alert('리뷰가 삭제되었습니다.');
        }
        if (backToDetailsBtn) backToDetailsBtn.click();
    });
}