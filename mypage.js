// --- 1단계: 전역 변수 및 요소 선택 (이전과 동일) ---
const API_KEY = '025ca0b1f29347fb2fcd2d4d23cffc18';
const reviewsListContainer = document.getElementById('my-reviews-list');
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
const logoutButton = document.getElementById('logout-button');
const backLink = document.querySelector('.home-link');

const VERSION_PREFIX = sessionStorage.getItem('appVersionPrefix') || 'v_unknown_';
let currentMovieData = {};

// --- 2단계: 이벤트 리스너 설정 (이전과 동일) ---
document.addEventListener('DOMContentLoaded', () => {
    if (backLink) { backLink.href = 'ocn.html'; }
    loadMyReviews();
});

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        sessionStorage.clear();
        alert('로그아웃되었습니다.');
        location.href = 'index.html';
    });
}

// --- 3단계: 리뷰 불러오기 및 화면 표시 함수 (이전과 동일) ---
async function loadMyReviews() {
    if(!reviewsListContainer) return;
    reviewsListContainer.innerHTML = '<p class="loading">리뷰를 불러오는 중...</p>';
    const allKeys = Object.keys(localStorage);
    const reviewItems = [];
    await Promise.all(allKeys.map(async (key) => {
        if (key.startsWith(VERSION_PREFIX) && !key.includes('recentSearches')) {
            const savedValue = localStorage.getItem(key);
            if (!savedValue) return;
            try {
                const reviewData = JSON.parse(savedValue);
                if (reviewData && reviewData.reviewText && reviewData.mediaType) {
                    const originalMovieId = key.substring(VERSION_PREFIX.length);
                    const itemDetails = await fetchItemDetails(reviewData.mediaType, originalMovieId);
                    if (itemDetails) {
                        itemDetails.media_type = reviewData.mediaType;
                        reviewItems.push(itemDetails);
                    }
                }
            } catch(e) { console.warn(`오래된 형식의 리뷰 데이터를 건너뜁니다: ${key}`); }
        }
    }));
    reviewItems.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));
    if (reviewItems.length === 0) {
        reviewsListContainer.innerHTML = '<p class="no-results">아직 작성한 리뷰가 없습니다.</p>';
        return;
    }
    const cardPromises = reviewItems.map(item => createCardHTML(item));
    const cards = await Promise.all(cardPromises);
    reviewsListContainer.innerHTML = cards.join('');
}


// --- 4단계: 모달 관련 기능 (✨ 대규모 수정) ---
function closeModal() { if (modalOverlay) modalOverlay.classList.remove('visible'); }
if (closeButton) closeButton.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', (event) => { if (event.target === modalOverlay) closeModal(); });

// ✨ [수정] My Reviews 페이지의 카드 클릭 이벤트
if (reviewsListContainer) {
    reviewsListContainer.addEventListener('click', async (event) => {
        const card = event.target.closest('.movie-card');
        if (card) {
            const movieId = card.dataset.id;
            const mediaType = card.dataset.type;
            const details = await fetchItemDetails(mediaType, movieId);
            if (!details) { alert('상세 정보를 불러오는 데 실패했습니다.'); return; }

            // 현재 영화 데이터 저장 (저장 버튼에서 사용)
            currentMovieData = details;
            currentMovieData.media_type = mediaType;
            
            // ✨ 상세 정보 뷰를 건너뛰고, 바로 리뷰 뷰를 보여주는 로직 실행
            if(reviewModalTitle) reviewModalTitle.textContent = `${currentMovieData.title || currentMovieData.name} - 리뷰`;
            const savedReviewJSON = localStorage.getItem(VERSION_PREFIX + currentMovieData.id);
            const savedReviewData = savedReviewJSON ? JSON.parse(savedReviewJSON) : null;
            if(reviewTextarea) reviewTextarea.value = savedReviewData ? savedReviewData.reviewText : '';
            
            // 뷰 전환 및 모달 표시
            if(detailsView) detailsView.style.display = 'none';
            if(reviewView) reviewView.style.display = 'block';
            if (modalOverlay) modalOverlay.classList.add('visible');
        }
    });
}

// ✨ [수정] '돌아가기' 버튼은 이제 상세 정보 뷰가 아닌, 모달을 바로 닫습니다.
if(backToDetailsBtn) {
    backToDetailsBtn.addEventListener('click', () => {
        closeModal();
    });
}

// '저장' 버튼 기능
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
            alert('리뷰가 수정되었습니다!');
        } else {
            localStorage.removeItem(storageKey);
            alert('리뷰가 삭제되었습니다.');
        }
        closeModal();
        loadMyReviews(); // 목록 새로고침
    });
}

// 이 페이지에서는 사용되지 않는 함수들이지만, 혹시 모를 참조 오류를 막기 위해 비워둡니다.
async function displayDetailsView() {}
if(showReviewViewBtn) { showReviewViewBtn.style.display = 'none'; }


// --- 5단계: API 및 카드 생성 함수 (이전과 동일) ---
async function createCardHTML(item) {
    const credits = await fetchCredits(item.media_type, item.id);
    const title = item.title || item.name;
    const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    return `<div class="movie-card my-review-version" data-id="${item.id}" data-type="${item.media_type}"><div class="movie-card-poster"><img src="${posterPath}" alt="${title} 포스터"></div><div class="movie-info"><h3>${title}</h3><div class="credits-info"><span><strong>감독:</strong> ${credits.director}</span><span><strong>출연:</strong> ${credits.cast}</span></div></div></div>`;
}

async function fetchCredits(mediaType, id) {
    const url = `https://api.themoviedb.org/3/${mediaType}/${id}/credits?api_key=${API_KEY}&language=ko-KR`;
    try {
        const response = await fetch(url);
        if (!response.ok) return { director: '정보 없음', cast: '정보 없음' };
        const data = await response.json();
        const creator = data.created_by?.[0]?.name;
        const director = data.crew.find(person => person.job === 'Director');
        const cast = data.cast.slice(0, 5).map(person => person.name).join(', ');
        return { director: creator || (director ? director.name : '정보 없음'), cast: cast || '정보 없음' };
    } catch (error) { return { director: '정보 없음', cast: '정보 없음' }; }
}
async function fetchItemDetails(mediaType, id) {
    const url = `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${API_KEY}&language=ko-KR`;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) { return null; }
}