const supabaseUrl = 'https://bmmhrilwjgfbcaefguyx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbWhyaWx3amdmYmNhZWZndXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTY3NTMsImV4cCI6MjA4NTY3Mjc1M30.KdBImt3wsO5XgZJqaHh1sfnB1rA3sMUbHOxUQ8Qn5Dk';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

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
const tabButtons = document.querySelectorAll('.tab-btn');
const backLink = document.querySelector('.home-link');

const GROUP_ID = sessionStorage.getItem('appGroupId');
// Get source from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const source = urlParams.get('source') || 'ocn'; // default to ocn
let currentTab = source;
let currentMovieData = {};

document.addEventListener('DOMContentLoaded', () => {
    if (!GROUP_ID) {
        location.href = 'index.html';
        return;
    }

    // Set active tab based on URL source
    tabButtons.forEach(btn => {
        if (btn.dataset.type === source) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }

        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.type;
            updateBackLink();
            loadMyReviews();
        });
    });

    updateBackLink();
    loadMyReviews();
});

function updateBackLink() {
    if (backLink) {
        backLink.href = currentTab === 'books' ? 'books.html' : 'ocn.html?source=ocn';
        // Optional: Update text/icon based on source if needed
        const iconSpan = backLink.querySelector('span');
        if (iconSpan) {
            backLink.innerHTML = `<span class="material-symbols-outlined">arrow_back</span> ${currentTab === 'books' ? 'Books' : 'OCN'}`;
        }
    }
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        sessionStorage.clear();
        alert('로그아웃되었습니다.');
        location.href = 'index.html';
    });
}

async function loadMyReviews() {
    if (!reviewsListContainer) return;
    reviewsListContainer.innerHTML = '<p class="loading">리뷰를 불러오는 중...</p>';

    let query = supabaseClient.from('reviews').select('*').eq('group_id', GROUP_ID);

    if (currentTab === 'ocn') {
        query = query.in('media_type', ['movie', 'tv']);
    } else if (currentTab === 'books') {
        query = query.eq('media_type', 'book');
    }

    const { data: reviews, error } = await query;

    if (error) {
        reviewsListContainer.innerHTML = `<p class="no-results">리뷰를 불러오는 데 실패했습니다.</p>`;
        return;
    }
    if (reviews.length === 0) {
        reviewsListContainer.innerHTML = '<p class="no-results">아직 작성한 리뷰가 없습니다.</p>';
        return;
    }

    // 저장된 데이터 직접 사용 (API 호출 불필요)
    reviews.sort((a, b) => (a.content_title || '').localeCompare(b.content_title || ''));

    const cardsHTML = reviews.map(review => createReviewCardHTML(review)).join('');
    reviewsListContainer.innerHTML = cardsHTML;
}
function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

async function createCardHTML(item) {
    // For books, item comes from Naver API structure tailored in fetchItemDetails
    // For movies, item comes from TMDB structure

    const title = item.title || item.name;
    let posterPath = '';

    if (item.media_type === 'book') {
        posterPath = item.image; // Naver API returns 'image' (already full URL)
    } else {
        posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null;
    }

    if (!posterPath) posterPath = 'https://via.placeholder.com/500x750?text=No+Image';

    return `<div class="movie-card my-review-version" data-id="${item.id}" data-type="${item.media_type}"><div class="movie-card-poster"><img src="${posterPath}" alt="${title} 포스터"></div><div class="movie-info"><h3>${title}</h3><p class="review-preview">${item.review_text || '리뷰 내용 없음'}</p></div></div>`;
}

function createReviewCardHTML(review) {
    const title = review.content_title || '제목 없음';
    const image = review.content_image || 'https://placehold.co/150x220?text=No+Image';
    const reviewPreview = review.review_text 
        ? (review.review_text.length > 80 
            ? review.review_text.substring(0, 80) + '...' 
            : review.review_text)
        : '리뷰 내용 없음';

    return `
        <div class="movie-card" data-id="${review.movie_id}" data-type="${review.media_type}">
            <div class="movie-card-poster">
                <img src="${image}" alt="${title}">
            </div>
            <div class="movie-info">
                <h3>${title}</h3>
                <p class="review-preview">${reviewPreview}</p>
            </div>
        </div>
    `;
}

function closeModal() { if (modalOverlay) modalOverlay.classList.remove('visible'); }
if (closeButton) closeButton.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', (event) => { if (event.target === modalOverlay) closeModal(); });

if (reviewsListContainer) {
    reviewsListContainer.addEventListener('click', async (event) => {
        const card = event.target.closest('.movie-card');
        if (card) {
            const movieId = card.dataset.id;
            const mediaType = card.dataset.type;
            const details = await fetchItemDetails(mediaType, movieId);
            if (!details) { alert('상세 정보를 불러오는 데 실패했습니다.'); return; }
            currentMovieData = { ...details, media_type: mediaType };

            if (reviewModalTitle) reviewModalTitle.textContent = `${currentMovieData.title || currentMovieData.name} - 리뷰`;
            const { data } = await supabaseClient.from('reviews').select('review_text').match({ movie_id: currentMovieData.id, group_id: GROUP_ID }).single();
            if (reviewTextarea) reviewTextarea.value = data ? data.review_text : '';

            if (detailsView) detailsView.style.display = 'none';
            if (reviewView) reviewView.style.display = 'block';
            if (modalOverlay) modalOverlay.classList.add('visible');

            // Focus on textarea for convenience
            if (reviewTextarea) {
                setTimeout(() => reviewTextarea.focus(), 100);
            }
        }
    });
}

// Keyboard shortcuts for review textarea
if (reviewTextarea) {
    reviewTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent newline
            if (saveButton) saveButton.click();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            if (backToDetailsBtn) backToDetailsBtn.click(); // Standard behavior: back to details
            else closeModal(); // Fallback: close modal
        }
    });
}

if (backToDetailsBtn) {
    backToDetailsBtn.addEventListener('click', () => {
        closeModal();
    });
}

if (saveButton) {
    saveButton.addEventListener('click', async () => {
        const { id, media_type } = currentMovieData;
        const reviewText = reviewTextarea.value.trim();
        const reviewData = {
            movie_id: id,
            media_type,
            review_text: reviewText,
            group_id: GROUP_ID
        };
        if (reviewText) {
            const { error } = await supabaseClient.from('reviews').upsert(reviewData, { onConflict: 'movie_id, group_id' });
            if (error) { alert('리뷰 수정에 실패했습니다: ' + error.message); }
            else { alert('리뷰가 수정되었습니다!'); }
        } else {
            const { error } = await supabaseClient.from('reviews').delete().match({ movie_id: id, group_id: GROUP_ID });
            if (error) { alert('리뷰 삭제에 실패했습니다: ' + error.message); }
            else { alert('리뷰가 삭제되었습니다.'); }
        }
        closeModal();
        loadMyReviews();
    });
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
    if (mediaType === 'book') {
        // Books는 API로 상세정보 불러오기 어려우므로, 
        // 저장된 리뷰 데이터에서 가져오기
        try {
            const { data: review } = await supabaseClient
                .from('reviews')
                .select('*')
                .match({ movie_id: id, group_id: GROUP_ID })
                .single();
            
            if (review) {
                return {
                    id: id,
                    title: review.content_title || '제목 없음',
                    name: review.content_title || '제목 없음',
                    image: review.content_image || '',
                    media_type: 'book',
                    overview: '저장된 리뷰를 확인하세요.'
                };
            }
            return null;
        } catch (e) { return null; }
    } else {
        // TMDB Fetch
        const url = `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${API_KEY}&language=ko-KR`;
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) { return null; }
    }
}