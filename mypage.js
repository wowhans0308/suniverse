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
const tierMySelect = document.getElementById('tier-my');
const myUserLabel = document.getElementById('my-user-label');
const partnerUserLabel = document.getElementById('partner-user-label');
const partnerTierBadge = document.getElementById('partner-tier-badge');
const partnerReviewText = document.getElementById('partner-review-text');

const GROUP_ID = sessionStorage.getItem('appGroupId');
const USER_ID = sessionStorage.getItem('appUserId');

const MY_NAME = USER_ID === 'me' ? '지형' : '수인';
const PARTNER_NAME = USER_ID === 'me' ? '수인' : '지형';
const MY_TIER_FIELD = USER_ID === 'me' ? 'tier_me' : 'tier_partner';
const MY_REVIEW_FIELD = USER_ID === 'me' ? 'review_me' : 'review_partner';
const PARTNER_TIER_FIELD = USER_ID === 'me' ? 'tier_partner' : 'tier_me';
const PARTNER_REVIEW_FIELD = USER_ID === 'me' ? 'review_partner' : 'review_me';

const urlParams = new URLSearchParams(window.location.search);
const source = urlParams.get('source') || 'ocn';
let currentTab = source;
let currentMovieData = {};

document.addEventListener('DOMContentLoaded', () => {
    if (!GROUP_ID || !USER_ID) {
        location.href = 'index.html';
        return;
    }

    if (myUserLabel) myUserLabel.textContent = MY_NAME;
    if (partnerUserLabel) partnerUserLabel.textContent = PARTNER_NAME;

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

    const myReviews = reviews.filter(r => r[MY_TIER_FIELD] || r[MY_REVIEW_FIELD]);

    if (myReviews.length === 0) {
        reviewsListContainer.innerHTML = '<p class="no-results">아직 작성한 리뷰가 없습니다.</p>';
        return;
    }

    myReviews.sort((a, b) => (a.content_title || '').localeCompare(b.content_title || ''));

    const cardsHTML = myReviews.map(review => createReviewCardHTML(review)).join('');
    reviewsListContainer.innerHTML = cardsHTML;
}

function createReviewCardHTML(review) {
    const title = review.content_title || '제목 없음';
    const image = review.content_image || 'https://placehold.co/150x220?text=No+Image';
    const myReview = review[MY_REVIEW_FIELD] || '';
    const reviewPreview = myReview
        ? (myReview.length > 80 ? myReview.substring(0, 80) + '...' : myReview)
        : '리뷰 내용 없음';
    const myTier = review[MY_TIER_FIELD] || '';
    const tierClass = myTier ? 'tier-color-' + (myTier === 'A+' ? 'Aplus' : myTier) : '';

    return '<div class="movie-card" data-id="' + review.movie_id + '" data-type="' + review.media_type + '">' +
        '<div class="movie-card-poster">' +
        '<img src="' + image + '" alt="' + title + '">' +
        (myTier ? '<div class="card-tier-badge ' + tierClass + '">' + myTier + '</div>' : '') +
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

if (reviewsListContainer) {
    reviewsListContainer.addEventListener('click', async (event) => {
        const card = event.target.closest('.movie-card');
        if (card) {
            const movieId = card.dataset.id;
            const mediaType = card.dataset.type;

            if (mediaType === 'book') {
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

if (showReviewViewBtn) {
    showReviewViewBtn.addEventListener('click', async () => {
        const title = currentMovieData.title || currentMovieData.name;
        const id = currentMovieData.id;

        if (reviewModalTitle) reviewModalTitle.textContent = title + ' - 리뷰';

        const { data } = await supabaseClient
            .from('reviews')
            .select('review_me, review_partner, tier_me, tier_partner')
            .eq('movie_id', id)
            .eq('group_id', GROUP_ID);

        const review = data && data.length > 0 ? data[0] : null;

        if (tierMySelect) tierMySelect.value = review?.[MY_TIER_FIELD] || '';
        if (reviewTextarea) reviewTextarea.value = review?.[MY_REVIEW_FIELD] || '';

        const pTier = review?.[PARTNER_TIER_FIELD] || '';
        const pText = review?.[PARTNER_REVIEW_FIELD] || '';

        if (partnerTierBadge) {
            if (pTier) {
                partnerTierBadge.textContent = pTier;
                partnerTierBadge.className = 'partner-tier-badge tier-badge-visible tier-color-' + (pTier === 'A+' ? 'Aplus' : pTier);
            } else {
                partnerTierBadge.textContent = '';
                partnerTierBadge.className = 'partner-tier-badge';
            }
        }
        if (partnerReviewText) {
            partnerReviewText.textContent = pText || '아직 작성된 리뷰가 없습니다.';
            partnerReviewText.style.color = pText ? '' : 'var(--text-muted-color)';
            partnerReviewText.style.fontStyle = pText ? '' : 'italic';
        }

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
        const reviewText = reviewTextarea ? reviewTextarea.value.trim() : '';
        const myTier = tierMySelect ? tierMySelect.value : null;

        const reviewData = {
            movie_id: id,
            media_type: media_type,
            group_id: GROUP_ID,
            content_title: title,
            content_image: image,
            [MY_TIER_FIELD]: myTier || null,
            [MY_REVIEW_FIELD]: reviewText || null
        };

        if (reviewText || myTier) {
            const { error } = await supabaseClient.from('reviews').upsert(reviewData, { onConflict: 'movie_id, group_id' });
            if (error) { alert('리뷰 수정에 실패했습니다: ' + error.message); }
            else { alert('저장되었습니다!'); }
        } else {
            const updateData = {
                [MY_TIER_FIELD]: null,
                [MY_REVIEW_FIELD]: null
            };
            const { error } = await supabaseClient.from('reviews').update(updateData).match({ movie_id: id, group_id: GROUP_ID });
            if (error) { alert('업데이트 실패: ' + error.message); }
            else { alert('내 리뷰가 삭제되었습니다.'); }
        }
        closeModal();
        loadMyReviews();
    });
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
