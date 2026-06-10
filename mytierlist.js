const supabaseUrl = 'https://bmmhrilwjgfbcaefguyx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbWhyaWx3amdmYmNhZWZndXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTY3NTMsImV4cCI6MjA4NTY3Mjc1M30.KdBImt3wsO5XgZJqaHh1sfnB1rA3sMUbHOxUQ8Qn5Dk';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

const API_KEY = '025ca0b1f29347fb2fcd2d4d23cffc18';
const TIERS = ['S', 'A+', 'A', 'B', 'C', 'D', 'F'];

let tierContentMe;
let tierContentPartner;
let logoutButton;
let tabButtons;
let backLink;
let modalOverlay;
let closeButton;
let detailsView;
let modalPoster;
let modalTitle;
let modalCredits;
let modalOverview;
let showReviewViewBtn;
let reviewView;
let reviewModalTitle;
let reviewTextarea;
let backToDetailsBtn;
let saveButton;
let tierMySelect;
let myUserLabel;
let partnerUserLabel;
let partnerTierBadge;
let partnerReviewText;

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
let currentItemData = {};
let allReviews = [];

document.addEventListener('DOMContentLoaded', () => {
    tierContentMe = document.getElementById('tier-content-me');
    tierContentPartner = document.getElementById('tier-content-partner');
    logoutButton = document.getElementById('logout-button');
    tabButtons = document.querySelectorAll('.tab-btn');
    backLink = document.querySelector('.home-link');
    modalOverlay = document.querySelector('.modal-overlay');
    closeButton = document.querySelector('.close-button');
    detailsView = document.getElementById('details-view');
    modalPoster = document.getElementById('modal-poster');
    modalTitle = document.getElementById('modal-title');
    modalCredits = document.getElementById('modal-credits');
    modalOverview = document.getElementById('modal-overview');
    showReviewViewBtn = document.getElementById('show-review-view-btn');
    reviewView = document.getElementById('review-view');
    reviewModalTitle = document.getElementById('review-modal-title');
    reviewTextarea = document.getElementById('review-textarea');
    backToDetailsBtn = document.getElementById('back-to-details-btn');
    saveButton = document.getElementById('save-button');
    tierMySelect = document.getElementById('tier-my');
    myUserLabel = document.getElementById('my-user-label');
    partnerUserLabel = document.getElementById('partner-user-label');
    partnerTierBadge = document.getElementById('partner-tier-badge');
    partnerReviewText = document.getElementById('partner-review-text');

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
            loadTierLists();
        });
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.clear();
            alert('로그아웃되었습니다.');
            location.href = 'index.html';
        });
    }

    if (closeButton) closeButton.addEventListener('click', closeModal);

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    if (showReviewViewBtn) {
        showReviewViewBtn.addEventListener('click', async () => {
            const title = currentItemData.title || '제목 없음';
            if (reviewModalTitle) reviewModalTitle.textContent = title + ' - 리뷰';

            const { data, error: reviewErr } = await supabaseClient
                .from('reviews')
                .select('*')
                .eq('movie_id', String(currentItemData.id))
                .eq('group_id', GROUP_ID);

            if (reviewErr) console.error('리뷰 로드 오류:', reviewErr.message);

            const review = data && data.length > 0 ? data[0] : null;

            if (reviewTextarea) {
                reviewTextarea.value = (review?.[MY_REVIEW_FIELD] ?? review?.review_text ?? '');
                reviewTextarea.focus();
            }
            if (tierMySelect) tierMySelect.value = review?.[MY_TIER_FIELD] || '';

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
            const id = currentItemData.id;
            const media_type = currentItemData.media_type;
            const title = currentItemData.title;
            const image = currentItemData.image;
            const reviewText = reviewTextarea ? reviewTextarea.value.trim() : '';
            const myTier = tierMySelect ? tierMySelect.value : null;

            const reviewData = {
                movie_id: String(id),
                media_type: media_type,
                group_id: GROUP_ID,
                content_title: title,
                content_image: image,
                [MY_TIER_FIELD]: myTier || null,
                [MY_REVIEW_FIELD]: reviewText || null
            };

            if (reviewText || myTier) {
                const { error } = await supabaseClient
                    .from('reviews')
                    .upsert(reviewData, { onConflict: 'movie_id, group_id' });

                if (error) alert('저장 실패: ' + error.message);
                else alert('저장되었습니다!');
            } else {
                const updateData = {
                    [MY_TIER_FIELD]: null,
                    [MY_REVIEW_FIELD]: null
                };
                const { error } = await supabaseClient
                    .from('reviews')
                    .update(updateData)
                    .match({ movie_id: String(id), group_id: GROUP_ID });

                if (error) alert('업데이트 실패: ' + error.message);
                else alert('내 리뷰가 삭제되었습니다.');
            }

            closeModal();
            loadTierLists();
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

    updateBackLink();
    loadTierLists();
});

function updateBackLink() {
    if (backLink) {
        backLink.href = currentTab === 'books' ? 'books.html' : 'ocn.html';
        backLink.innerHTML = '<span class="material-symbols-outlined">arrow_back</span> ' + (currentTab === 'books' ? 'Books' : 'OCN');
    }
}

async function loadTierLists() {
    if (!tierContentMe || !tierContentPartner) return;

    tierContentMe.innerHTML = '<p class="loading">불러오는 중...</p>';
    tierContentPartner.innerHTML = '<p class="loading">불러오는 중...</p>';

    let query = supabaseClient.from('reviews').select('*').eq('group_id', GROUP_ID);

    if (currentTab === 'ocn') {
        query = query.in('media_type', ['movie', 'tv']);
    } else if (currentTab === 'books') {
        query = query.eq('media_type', 'book');
    }

    const { data: reviews, error } = await query;

    if (error) {
        tierContentMe.innerHTML = '<p class="no-results">불러오기 실패</p>';
        tierContentPartner.innerHTML = '<p class="no-results">불러오기 실패</p>';
        return;
    }

    allReviews = reviews || [];

    const reviewsWithTierMe = allReviews.filter(r => r.tier_me);
    const reviewsWithTierPartner = allReviews.filter(r => r.tier_partner);

    renderTierColumn(tierContentMe, reviewsWithTierMe, 'tier_me');
    renderTierColumn(tierContentPartner, reviewsWithTierPartner, 'tier_partner');

    addCardClickListeners();
}

function renderTierColumn(container, reviews, tierField) {
    if (reviews.length === 0) {
        container.innerHTML = '<p class="no-results">티어가 지정된 항목이 없습니다.</p>';
        return;
    }

    let html = '';

    TIERS.forEach(tier => {
        const tierReviews = reviews.filter(r => r[tierField] === tier);
        if (tierReviews.length > 0) {
            const tierClass = tier === 'A+' ? 'tier-A-plus' : 'tier-' + tier;
            html += '<div class="tier-group">';
            html += '<div class="tier-header ' + tierClass + '">' + tier + '</div>';
            html += '<div class="tier-items">';
            tierReviews.forEach(review => {
                html += createTierItemHTML(review);
            });
            html += '</div>';
            html += '</div>';
        }
    });

    container.innerHTML = html;
}

function createTierItemHTML(review) {
    const title = review.content_title || '제목 없음';
    const image = review.content_image || 'https://placehold.co/60x90?text=No';

    return '<div class="tier-item" data-id="' + review.movie_id + '" data-type="' + review.media_type + '">' +
        '<img src="' + image + '" alt="' + title + '">' +
        '<div class="title">' + title + '</div>' +
        '</div>';
}

function addCardClickListeners() {
    document.querySelectorAll('.tier-item').forEach(item => {
        item.addEventListener('click', async () => {
            const movieId = item.dataset.id;
            const mediaType = item.dataset.type;

            const review = allReviews.find(r => String(r.movie_id) === String(movieId));

            if (!review) {
                alert('데이터를 찾을 수 없습니다.');
                return;
            }

            currentItemData = {
                id: movieId,
                media_type: mediaType,
                title: review.content_title,
                image: review.content_image
            };

            if (mediaType === 'movie' || mediaType === 'tv') {
                const details = await fetchItemDetails(mediaType, movieId);
                if (details) {
                    currentItemData.overview = details.overview;
                    currentItemData.credits = await fetchCredits(mediaType, movieId);
                }
            } else if (mediaType === 'book') {
                currentItemData.overview = '저장된 리뷰를 확인하세요.';
            }

            displayDetailsView();
            if (modalOverlay) modalOverlay.classList.add('visible');
        });
    });
}

function closeModal() {
    if (modalOverlay) modalOverlay.classList.remove('visible');
}

function displayDetailsView() {
    const title = currentItemData.title || '제목 없음';
    const image = currentItemData.image || 'https://placehold.co/300x450?text=No+Image';
    const overview = currentItemData.overview || '상세 정보가 없습니다.';

    if (modalPoster) modalPoster.src = image;
    if (modalTitle) modalTitle.textContent = title;

    if (modalCredits) {
        if (currentItemData.credits) {
            modalCredits.innerHTML = '<p><strong>감독:</strong> ' + currentItemData.credits.director + '</p><p><strong>출연:</strong> ' + currentItemData.credits.cast + '</p>';
        } else if (currentItemData.media_type === 'book') {
            modalCredits.innerHTML = '<p>도서 정보</p>';
        } else {
            modalCredits.innerHTML = '';
        }
    }

    if (modalOverview) modalOverview.textContent = overview;
    if (detailsView) detailsView.style.display = 'block';
    if (reviewView) reviewView.style.display = 'none';
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

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('visible')) {
        closeModal();
    }
});
