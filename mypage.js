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
const tierMeSelect = document.getElementById('tier-me');
const tierPartnerSelect = document.getElementById('tier-partner');

const GROUP_ID = sessionStorage.getItem('appGroupId');
const urlParams = new URLSearchParams(window.location.search);
const source = urlParams.get('source') || 'ocn';
let currentTab = source;
let currentMovieData = {};

document.addEventListener('DOMContentLoaded', () => {
    if (!GROUP_ID) {
        location.href = 'index.html';
        return;
    }

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
        backLink.href = currentTab === 'books' ? 'books.html' : 'ocn.html';
        backLink.innerHTML = '<span class="material-symbols-outlined">arrow_back</span> ' + (currentTab === 'books' ? 'Books' : 'OCN');
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
        reviewsListContainer.innerHTML = '<p class="no-results">리뷰를 불러오는 데 실패했습니다.</p>';
        return;
    }
    if (!reviews || reviews.length === 0) {
        reviewsListContainer.innerHTML = '<p class="no-results">아직 작성한 리뷰가 없습니다.</p>';
        return;
    }

    reviews.sort((a, b) => (a.content_title || '').localeCompare(b.content_title || ''));

    const cardsHTML = reviews.map(review => createReviewCardHTML(review)).join('');
    reviewsListContainer.innerHTML = cardsHTML;
}

function createReviewCardHTML(review) {
    const title = review.content_title || '제목 없음';
    const image = review.content_image || 'https://placehold.co/150x220?text=No+Image';
    const reviewPreview = review.review_text
        ? (review.review_text.length > 80
            ? review.review_text.substring(0, 80) + '...'
            : review.review_text)
        : '리뷰 내용 없음';

    return '<div class="movie-card" data-id="' + review.movie_id + '" data-type="' + review.media_type + '">' +
        '<div class="movie-card-poster">' +
        '<img src="' + image + '" alt="' + title + '">' +
        '</div>' +
        '<div class="movie-info">' +
        '<h3>' + title + '</h3>' +
        '<p class="review-preview">' + reviewPreview + '</p>' +
        '</div>' +
        '</div>';
}

function closeModal() { if (modalOverlay) modalOverlay.classList.remove('visible'); }
if (closeButton) closeButton.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', (event) => { if (event.target === modalOverlay) closeModal(); });

// ★ 수정: 카드 클릭 시 바로 리뷰창이 아닌 상세정보 모달을 먼저 표시
if (reviewsListContainer) {
    reviewsListContainer.addEventListener('click', async (event) => {
        const card = event.target.closest('.movie-card');
        if (card) {
            const movieId = card.dataset.id;
            const mediaType = card.dataset.type;

            if (mediaType === 'book') {
                // 도서: DB에서 저장된 정보 사용
                const { data: reviewList } = await supabaseClient
                    .from('reviews')
                    .select('*')
                    .eq('movie_id', movieId)
                    .eq('group_id', GROUP_ID);

                const reviewData = reviewList && reviewList.length > 0 ? reviewList[0] : null;

                if (!reviewData) {
                    alert('상세 정보를 불러오는 데 실패했습니다.');
                    return;
                }

                currentMovieData = {
                    id: movieId,
                    media_type: 'book',
                    title: reviewData.content_title || '제목 없음',
                    name: reviewData.content_title || '제목 없음',
                    image: reviewData.content_image || '',
                    overview: '저장된 리뷰를 확인하세요.'
                };

                displayDetailsView();
                if (modalOverlay) modalOverlay.classList.add('visible');

            } else {
                // 영화/TV: TMDB API에서 상세정보 가져오기
                const details = await fetchItemDetails(mediaType, movieId);
                if (!details) {
                    alert('상세 정보를 불러오는 데 실패했습니다.');
                    return;
                }
                currentMovieData = { ...details, media_type: mediaType };

                await displayDetailsViewForOCN();
                if (modalOverlay) modalOverlay.classList.add('visible');
            }
        }
    });
}

// 상세정보 표시 - OCN (영화/TV)
async function displayDetailsViewForOCN() {
    const posterPath = currentMovieData.poster_path
        ? 'https://image.tmdb.org/t/p/w500' + currentMovieData.poster_path
        : 'https://placehold.co/300x450?text=No+Image';
    const credits = await fetchCredits(currentMovieData.media_type, currentMovieData.id);

    if (modalPoster) modalPoster.src = posterPath;
    if (modalTitle) modalTitle.textContent = currentMovieData.title || currentMovieData.name;
    if (modalCredits) modalCredits.innerHTML = '<p><strong>감독:</strong> ' + credits.director + '</p><p><strong>출연:</strong> ' + credits.cast + '</p>';
    if (modalOverview) modalOverview.textContent = currentMovieData.overview || '줄거리 정보가 없습니다.';
    if (detailsView) detailsView.style.display = 'block';
    if (reviewView) reviewView.style.display = 'none';
}

// 상세정보 표시 - Books
function displayDetailsView() {
    const title = currentMovieData.title || currentMovieData.name || '제목 없음';
    const image = currentMovieData.image || 'https://placehold.co/300x450?text=No+Image';
    const overview = currentMovieData.overview || '상세 정보가 없습니다.';

    if (modalPoster) modalPoster.src = image;
    if (modalTitle) modalTitle.textContent = title;
    if (modalCredits) modalCredits.innerHTML = '<p>도서 정보</p>';
    if (modalOverview) modalOverview.textContent = overview;
    if (detailsView) detailsView.style.display = 'block';
    if (reviewView) reviewView.style.display = 'none';
}

// ★ 리뷰 쓰기/수정 버튼 클릭 시 리뷰 입력창으로 전환
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

        if (reviewTextarea) {
            setTimeout(() => reviewTextarea.focus(), 100);
        }

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

// ★ 수정: 돌아가기 버튼 → 상세정보로 복귀 (모달 닫기가 아님)
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
        const image = currentMovieData.image || (currentMovieData.poster_path ? 'https://image.tmdb.org/t/p/w500' + currentMovieData.poster_path : '');
        const reviewText = reviewTextarea.value.trim();
        const tierMe = tierMeSelect ? tierMeSelect.value : null;
        const tierPartner = tierPartnerSelect ? tierPartnerSelect.value : null;

        const reviewData = {
            movie_id: id,
            media_type: media_type,
            review_text: reviewText,
            group_id: GROUP_ID,
            content_title: title,
            content_image: image,
            tier_me: tierMe || null,
            tier_partner: tierPartner || null
        };

        if (reviewText || tierMe || tierPartner) {
            const { error } = await supabaseClient.from('reviews').upsert(reviewData, { onConflict: 'movie_id, group_id' });
            if (error) { alert('리뷰 수정에 실패했습니다: ' + error.message); }
            else { alert('저장되었습니다!'); }
        } else {
            const { error } = await supabaseClient.from('reviews').delete().match({ movie_id: id, group_id: GROUP_ID });
            if (error) { alert('리뷰 삭제에 실패했습니다: ' + error.message); }
            else { alert('삭제되었습니다.'); }
        }
        closeModal();
        loadMyReviews();
    });
}

function stripHtml(html) {
    if (!html) return '';
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

async function fetchItemDetails(mediaType, id) {
    const url = 'https://api.themoviedb.org/3/' + mediaType + '/' + id + '?api_key=' + API_KEY + '&language=ko-KR';
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) { return null; }
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