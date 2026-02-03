// --- 1단계: 전역 변수 및 요소 선택 ---
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

const API_KEY = '025ca0b1f29347fb2fcd2d4d23cffc18';
const VERSION_PREFIX = sessionStorage.getItem('appVersionPrefix') || 'v_unknown_';
let currentCategory = '전체';
let lastResults = [];
let currentMovieData = {};

// --- 2단계: 이벤트 리스너 설정 ---
document.addEventListener('DOMContentLoaded', () => { displayRecentSearches(); });

if (searchButton) {
    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm === '') { return alert('검색어를 입력해주세요!'); }
        saveRecentSearch(searchTerm);
        fetchMovies(searchTerm);
    });
}
if (searchInput) {
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && searchButton) { searchButton.click(); }
    });
}
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        sessionStorage.clear();
        localStorage.removeItem(VERSION_PREFIX + 'recentSearches');
        alert('로그아웃되었습니다.');
        location.href = 'index.html';
    });
}

// --- 3단계: API 관련 함수 ---
async function fetchCredits(mediaType, id) {
    const url = `https://api.themoviedb.org/3/${mediaType}/${id}/credits?api_key=${API_KEY}&language=ko-KR`;
    try {
        const response = await fetch(url);
        if (!response.ok) return { director: '정보 없음', cast: '정보 없음' };
        const data = await response.json();
        const director = data.crew?.find(person => person.job === 'Director')?.name || data.created_by?.[0]?.name || '정보 없음';
        const cast = data.cast?.slice(0, 5).map(person => person.name).join(', ') || '정보 없음';
        return { director, cast };
    } catch (error) { return { director: '정보 없음', cast: '정보 없음' }; }
}

async function fetchMovies(query) {
    if (recentSearchesContainer) { recentSearchesContainer.style.display = 'none'; }
    if (resultsSection) { resultsSection.innerHTML = '<p class="loading">검색 중...</p>'; }
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=ko-KR&query=${query}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API 요청 실패`);
        const data = await response.json();
        lastResults = data.results;
        await displayResults();
    } catch (error) {
        if (resultsSection) { resultsSection.innerHTML = '<p class="no-results">오류가 발생했습니다.</p>'; }
    }
}

async function fetchItemDetails(mediaType, id) {
    const url = `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${API_KEY}&language=ko-KR`;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) { return null; }
}

// --- 4단계: 화면 표시 함수 ---
async function displayResults() {
    if (!resultsSection) return;
    resultsSection.innerHTML = '';
    const displayedMovieIds = new Set();
    let cardPromises = [];

    // 1. 인물 검색 결과를 먼저 처리
    const personResults = lastResults.filter(item => item.media_type === 'person');
    personResults.forEach(person => {
        person.known_for?.forEach(work => {
            if (!displayedMovieIds.has(work.id) && (work.media_type === 'movie' || work.media_type === 'tv')) {
                cardPromises.push(createCardHTML(work));
                displayedMovieIds.add(work.id);
            }
        });
    });

    // 2. 인물 외의 결과를 처리
    const otherResults = lastResults.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
    otherResults.forEach(item => {
        if (!displayedMovieIds.has(item.id)) {
            cardPromises.push(createCardHTML(item));
            displayedMovieIds.add(item.id);
        }
    });

    // 3. 필터링된 카드 HTML 생성
    const cardsHTML = (await Promise.all(cardPromises)).filter(card => card !== '').join('');
    resultsSection.innerHTML = cardsHTML;

    if (resultsSection.innerHTML === '') {
        resultsSection.innerHTML = '<p class="no-results">표시할 결과가 없습니다.</p>';
    }
}

async function createCardHTML(item) {
    const isAnimation = item.genre_ids?.includes(16);
    if (currentCategory === '영화' && (item.media_type !== 'movie' || isAnimation)) return '';
    if (currentCategory === '드라마' && (item.media_type !== 'tv' || isAnimation)) return '';
    if (currentCategory === '애니메이션' && !isAnimation) return '';

    const credits = await fetchCredits(item.media_type, item.id);
    const title = item.title || item.name;
    const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    return `<div class="movie-card" data-id="${item.id}" data-type="${item.media_type}"><div class="movie-card-poster"><img src="${posterPath}" alt="${title} 포스터"></div><div class="movie-info"><h3>${title}</h3><div class="credits-info"><span><strong>감독:</strong> ${credits.director}</span><span><strong>출연:</strong> ${credits.cast}</span></div></div></div>`;
}

// --- 5단계: 분류 및 최근 검색어 기능 ---
if (categoryButtons) {
    categoryButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            const clickedButton = event.target;
            clickedButton.classList.add('active');
            currentCategory = clickedButton.textContent;
            if (lastResults.length > 0) { displayResults(); }
        });
    });
}

function saveRecentSearch(term) {
    let searches = JSON.parse(localStorage.getItem(VERSION_PREFIX + 'recentSearches')) || [];
    searches = searches.filter(search => search.toLowerCase() !== term.toLowerCase());
    searches.unshift(term);
    if (searches.length > 10) searches = searches.slice(0, 10);
    localStorage.setItem(VERSION_PREFIX + 'recentSearches', JSON.stringify(searches));
}

function displayRecentSearches() {
    if (!recentSearchesContainer || !recentSearchesList) return;
    let searches = JSON.parse(localStorage.getItem(VERSION_PREFIX + 'recentSearches')) || [];
    if (searches.length > 0) {
        recentSearchesList.innerHTML = searches.map(term => `<span class="recent-search-item"><span>${term}</span><button class="delete-search-btn" data-term="${term}">&times;</button></span>`).join('');
        recentSearchesContainer.style.display = 'block';
    } else {
        recentSearchesContainer.style.display = 'none';
    }
}

if (recentSearchesList) {
    recentSearchesList.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('delete-search-btn')) {
            const termToDelete = target.dataset.term;
            let searches = JSON.parse(localStorage.getItem(VERSION_PREFIX + 'recentSearches')) || [];
            searches = searches.filter(search => search !== termToDelete);
            localStorage.setItem(VERSION_PREFIX + 'recentSearches', JSON.stringify(searches));
            displayRecentSearches();
        } else if (target.closest('.recent-search-item')) {
            const searchTerm = target.closest('.recent-search-item').querySelector('span').textContent;
            if(searchInput) searchInput.value = searchTerm;
            if(searchButton) searchButton.click();
        }
    });
}

// --- 6단계: 모달 관련 기능 ---
function closeModal() { if (modalOverlay) modalOverlay.classList.remove('visible'); }
if (closeButton) closeButton.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', (event) => { if (event.target === modalOverlay) closeModal(); });

if (resultsSection) {
    resultsSection.addEventListener('click', async (event) => {
        const card = event.target.closest('.movie-card');
        if (card) {
            const movieId = card.dataset.id;
            const mediaType = card.dataset.type;
            const details = await fetchItemDetails(mediaType, movieId);
            if (!details) { alert('상세 정보를 불러오는 데 실패했습니다.'); return; }
            currentMovieData = details;
            currentMovieData.media_type = mediaType;
            await displayDetailsView();
            if (modalOverlay) modalOverlay.classList.add('visible');
        }
    });
}

async function displayDetailsView() {
    const posterPath = currentMovieData.poster_path ? `https://image.tmdb.org/t/p/w500${currentMovieData.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    const credits = await fetchCredits(currentMovieData.media_type, currentMovieData.id);
    if(modalPoster) modalPoster.src = posterPath;
    if(modalTitle) modalTitle.textContent = currentMovieData.title || currentMovieData.name;
    if(modalCredits) modalCredits.innerHTML = `<p><strong>감독:</strong> ${credits.director}</p><p><strong>출연:</strong> ${credits.cast}</p>`;
    if(modalOverview) modalOverview.textContent = currentMovieData.overview || '줄거리 정보가 없습니다.';
    if(detailsView) detailsView.style.display = 'block';
    if(reviewView) reviewView.style.display = 'none';
}

if(showReviewViewBtn) {
    showReviewViewBtn.addEventListener('click', () => {
        if(reviewModalTitle) reviewModalTitle.textContent = `${currentMovieData.title || currentMovieData.name} - 리뷰`;
        const savedReviewJSON = localStorage.getItem(VERSION_PREFIX + currentMovieData.id);
        const savedReviewData = savedReviewJSON ? JSON.parse(savedReviewJSON) : null;
        if(reviewTextarea) reviewTextarea.value = savedReviewData ? savedReviewData.reviewText : '';
        if(detailsView) detailsView.style.display = 'none';
        if(reviewView) reviewView.style.display = 'block';
    });
}

if(backToDetailsBtn) {
    backToDetailsBtn.addEventListener('click', () => {
        if(detailsView) detailsView.style.display = 'block';
        if(reviewView) reviewView.style.display = 'none';
    });
}

if(saveButton){
    saveButton.addEventListener('click', () => {
        const reviewText = reviewTextarea.value.trim();
        const storageKey = VERSION_PREFIX + currentMovieData.id;
        const dataToSave = { 
            reviewText: reviewText, 
            mediaType: currentMovieData.media_type 
        };
        if (reviewText) {
            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
            alert('리뷰가 저장되었습니다!');
        } else {
            localStorage.removeItem(storageKey);
            alert('리뷰가 삭제되었습니다.');
        }
        if(backToDetailsBtn) backToDetailsBtn.click();
    });
}