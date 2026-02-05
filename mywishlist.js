const supabaseUrl = 'https://bmmhrilwjgfbcaefguyx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbWhyaWx3amdmYmNhZWZndXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTY3NTMsImV4cCI6MjA4NTY3Mjc1M30.KdBImt3wsO5XgZJqaHh1sfnB1rA3sMUbHOxUQ8Qn5Dk';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

const API_KEY = '025ca0b1f29347fb2fcd2d4d23cffc18';

let wishlistContainer;
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

const GROUP_ID = sessionStorage.getItem('appGroupId');
const urlParams = new URLSearchParams(window.location.search);
const source = urlParams.get('source') || 'ocn';
let currentTab = source;
let currentItemData = {};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    console.log('modal-overlay check:', document.querySelector('.modal-overlay'));
    
    // 요소 선택
    wishlistContainer = document.getElementById('wishlist-container');
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

    if (!GROUP_ID) {
        location.href = 'index.html';
        return;
    }

    // 탭 초기화
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
            loadWishlists();
        });
    });

    // 로그아웃 버튼
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.clear();
            alert('로그아웃되었습니다.');
            location.href = 'index.html';
        });
    }

    // 모달 닫기 버튼
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    // 모달 배경 클릭시 닫기
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    // 리뷰 쓰기 버튼
    if (showReviewViewBtn) {
        showReviewViewBtn.addEventListener('click', async () => {
            const title = currentItemData.title || '제목 없음';
            if (reviewModalTitle) reviewModalTitle.textContent = `${title} - 리뷰`;

            const { data } = await supabaseClient
                .from('reviews')
                .select('review_text')
                .eq('movie_id', currentItemData.id)
                .eq('group_id', GROUP_ID);

            if (reviewTextarea) {
                reviewTextarea.value = (data && data.length > 0) ? data[0].review_text : '';
                reviewTextarea.focus();
            }

            if (detailsView) detailsView.style.display = 'none';
            if (reviewView) reviewView.style.display = 'block';
        });
    }

    // 돌아가기 버튼
    if (backToDetailsBtn) {
        backToDetailsBtn.addEventListener('click', () => {
            if (detailsView) detailsView.style.display = 'block';
            if (reviewView) reviewView.style.display = 'none';
        });
    }

    // 저장 버튼
    if (saveButton) {
        saveButton.addEventListener('click', async () => {
            const { id, media_type, title, image } = currentItemData;
            const reviewText = reviewTextarea.value.trim();

            const reviewData = {
                movie_id: id,
                media_type: media_type,
                review_text: reviewText,
                group_id: GROUP_ID,
                content_title: title,
                content_image: image
            };

            if (reviewText) {
                const { error } = await supabaseClient
                    .from('reviews')
                    .upsert(reviewData, { onConflict: 'movie_id, group_id' });

                if (error) alert('리뷰 저장 실패: ' + error.message);
                else alert('리뷰가 저장되었습니다!');
            } else {
                const { error } = await supabaseClient
                    .from('reviews')
                    .delete()
                    .match({ movie_id: id, group_id: GROUP_ID });

                if (error) alert('리뷰 삭제 실패: ' + error.message);
                else alert('리뷰가 삭제되었습니다.');
            }

            if (backToDetailsBtn) backToDetailsBtn.click();
        });
    }

    // 리뷰 textarea 키보드 단축키
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

// 위시리스트 카드 클릭 이벤트
    if (wishlistContainer) {
        wishlistContainer.addEventListener('click', async (event) => {
            // 하트 버튼 클릭
            const wishlistBtn = event.target.closest('.wishlist-btn');
            if (wishlistBtn) {
                event.stopPropagation();
                const contentId = wishlistBtn.dataset.id;

                const { error } = await supabaseClient
                    .from('wishlists')
                    .delete()
                    .match({ content_id: contentId, group_id: GROUP_ID });

                if (error) {
                    alert('제거 실패: ' + error.message);
                } else {
                    alert('위시리스트에서 제거되었습니다.');
                    loadWishlists();
                }
                return;
            }

            // 카드 클릭 - 모달 열기
            const card = event.target.closest('.movie-card');
            console.log('Card clicked:', card);
            if (card) {
                const contentId = card.dataset.id;
                const mediaType = card.dataset.type;
                console.log('contentId:', contentId, 'mediaType:', mediaType);

                const { data: wishlistItems, error } = await supabaseClient
                    .from('wishlists')
                    .select('*')
                    .eq('content_id', contentId)
                    .eq('group_id', GROUP_ID);

                console.log('wishlistItems:', wishlistItems);
                console.log('error:', error);

                const wishlistItem = wishlistItems && wishlistItems.length > 0 ? wishlistItems[0] : null;

                if (!wishlistItem) {
                    alert('상세 정보를 불러오는 데 실패했습니다.');
                    return;
                }

                currentItemData = {
                    id: contentId,
                    media_type: mediaType,
                    title: wishlistItem.content_title,
                    image: wishlistItem.content_image
                };

                // OCN인 경우 TMDB에서 추가 정보 가져오기
                if (mediaType === 'movie' || mediaType === 'tv') {
                    const details = await fetchItemDetails(mediaType, contentId);
                    if (details) {
                        currentItemData.overview = details.overview;
                        currentItemData.credits = await fetchCredits(mediaType, contentId);
                    }
                }

                console.log('currentItemData:', currentItemData);
                console.log('modalOverlay:', modalOverlay);

                displayDetailsView();
                
                if (modalOverlay) {
                    modalOverlay.classList.add('visible');
                    console.log('Modal opened!');
                }
            }
        });
    }

    updateBackLink();
    loadWishlists();
});

function updateBackLink() {
    if (backLink) {
        backLink.href = currentTab === 'books' ? 'books.html' : 'ocn.html';
        backLink.innerHTML = `<span class="material-symbols-outlined">arrow_back</span> ${currentTab === 'books' ? 'Books' : 'OCN'}`;
    }
}

async function loadWishlists() {
    if (!wishlistContainer) return;
    wishlistContainer.innerHTML = '<p class="loading">위시리스트를 불러오는 중...</p>';

    let query = supabaseClient.from('wishlists').select('*').eq('group_id', GROUP_ID);

    if (currentTab === 'ocn') {
        query = query.in('media_type', ['movie', 'tv']);
    } else if (currentTab === 'books') {
        query = query.eq('media_type', 'book');
    }

    const { data: wishlists, error } = await query;

    if (error) {
        wishlistContainer.innerHTML = '<p class="no-results">위시리스트를 불러오는 데 실패했습니다.</p>';
        return;
    }

    if (!wishlists || wishlists.length === 0) {
        wishlistContainer.innerHTML = '<p class="no-results">위시리스트가 비어있습니다.</p>';
        return;
    }

    wishlists.sort((a, b) => (a.content_title || '').localeCompare(b.content_title || ''));

    const cardsHTML = wishlists.map(item => createWishlistCardHTML(item)).join('');
    wishlistContainer.innerHTML = cardsHTML;
}

function createWishlistCardHTML(item) {
    const title = item.content_title || '제목 없음';
    const image = item.content_image || 'https://placehold.co/150x220?text=No+Image';

    return `
        <div class="movie-card" data-id="${item.content_id}" data-type="${item.media_type}">
            <div class="movie-card-poster">
                <img src="${image}" alt="${title}">
                <button class="wishlist-btn active" data-id="${item.content_id}" title="위시리스트에서 제거">
                    <span class="material-symbols-outlined">favorite</span>
                </button>
            </div>
            <div class="movie-info">
                <h3>${title}</h3>
            </div>
        </div>
    `;
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
            modalCredits.innerHTML = `<p><strong>감독:</strong> $${currentItemData.credits.director}</p><p><strong>출연:</strong> $${currentItemData.credits.cast}</p>`;
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
    const url = `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${API_KEY}&language=ko-KR`;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) { return null; }
}

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

// ESC 키로 모달 닫기
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('visible')) {
        closeModal();
    }
});