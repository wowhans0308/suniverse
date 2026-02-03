const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

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

const GROUP_ID = sessionStorage.getItem('appGroupId') || 'unknown_group';
let currentMovieData = {};

document.addEventListener('DOMContentLoaded', () => {
    loadMyReviews();
});

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

    const { data: reviews, error } = await supabase.from('reviews').select('*').eq('group_id', GROUP_ID);

    if (error) {
        reviewsListContainer.innerHTML = `<p class="no-results">리뷰를 불러오는 데 실패했습니다.</p>`;
        return;
    }
    if (reviews.length === 0) {
        reviewsListContainer.innerHTML = '<p class="no-results">아직 작성한 리뷰가 없습니다.</p>';
        return;
    }

    const reviewItems = [];
    await Promise.all(reviews.map(async (review) => {
        const itemDetails = await fetchItemDetails(review.media_type, review.movie_id);
        if (itemDetails) {
            itemDetails.media_type = review.media_type;
            reviewItems.push(itemDetails);
        }
    }));

    reviewItems.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));

    const cardPromises = reviewItems.map(item => createCardHTML(item));
    const cards = await Promise.all(cardPromises);
    reviewsListContainer.innerHTML = cards.join('');
}

async function createCardHTML(item) {
    const credits = await fetchCredits(item.media_type, item.id);
    const title = item.title || item.name;
    const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    return `<div class="movie-card my-review-version" data-id="${item.id}" data-type="${item.media_type}"><div class="movie-card-poster"><img src="${posterPath}" alt="${title} 포스터"></div><div class="movie-info"><h3>${title}</h3><div class="credits-info"><span><strong>감독:</strong> ${credits.director}</span><span><strong>출연:</strong> ${credits.cast}</span></div></div></div>`;
}

function closeModal() {
    if (modalOverlay) modalOverlay.classList.remove('visible');
}
if (closeButton) closeButton.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) closeModal();
});

if (reviewsListContainer) {
    reviewsListContainer.addEventListener('click', async (event) => {
        const card = event.target.closest('.movie-card');
        if (card) {
            const movieId = card.dataset.id;
            const mediaType = card.dataset.type;
            const details = await fetchItemDetails(mediaType, movieId);
            if (!details) {
                alert('상세 정보를 불러오는 데 실패했습니다.');
                return;
            }
            currentMovieData = details;
            currentMovieData.media_type = mediaType;
            
            // My Reviews에서는 바로 리뷰 뷰를 보여줍니다.
            if(reviewModalTitle) reviewModalTitle.textContent = `${currentMovieData.title || currentMovieData.name} - 리뷰`;
            const { data } = await supabase.from('reviews').select('review_text').match({ movie_id: currentMovieData.id, group_id: GROUP_ID }).single();
            if(reviewTextarea) reviewTextarea.value = data ? data.review_text : '';
            
            if(detailsView) detailsView.style.display = 'none';
            if(reviewView) reviewView.style.display = 'block';
            if (modalOverlay) modalOverlay.classList.add('visible');
        }
    });
}

if(backToDetailsBtn) {
    backToDetailsBtn.addEventListener('click', () => {
        closeModal();
    });
}

if(saveButton){
    saveButton.addEventListener('click', async () => {
        const reviewText = reviewTextarea.value.trim();
        const reviewData = { 
            movie_id: currentMovieData.id, 
            media_type: currentMovieData.media_type,
            review_text: reviewText, 
            group_id: GROUP_ID
        };
        if (reviewText) {
            const { error } = await supabase.from('reviews').upsert(reviewData, { onConflict: 'movie_id, group_id' });
            if (error) { alert('리뷰 수정에 실패했습니다: ' + error.message); }
            else { alert('리뷰가 수정되었습니다!'); }
        } else {
            const { error } = await supabase.from('reviews').delete().match({ movie_id: currentMovieData.id, group_id: GROUP_ID });
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
    } catch (error) {
        console.error('Credits 정보 로딩 에러:', error);
        return { director: '정보 없음', cast: '정보 없음' };
    }
}
async function fetchItemDetails(mediaType, id) {
    const url = `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${API_KEY}&language=ko-KR`;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('상세 정보 로딩 에러:', error);
        return null;
    }
}