const supabaseUrl = 'https://bmmhrilwjgfbcaefguyx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbWhyaWx3amdmYmNhZWZndXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTY3NTMsImV4cCI6MjA4NTY3Mjc1M30.KdBImt3wsO5XgZJqaHh1sfnB1rA3sMUbHOxUQ8Qn5Dk';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

const wishlistContainer = document.getElementById('wishlist-container');
const logoutButton = document.getElementById('logout-button');
const tabButtons = document.querySelectorAll('.tab-btn');
const backLink = document.querySelector('.home-link');

const GROUP_ID = sessionStorage.getItem('appGroupId');
const urlParams = new URLSearchParams(window.location.search);
const source = urlParams.get('source') || 'ocn';
let currentTab = source;

document.addEventListener('DOMContentLoaded', () => {
    if (!GROUP_ID) {
        location.href = 'index.html';
        return;
    }

    // 탭 초기화 및 이벤트
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

    updateBackLink();
    loadWishlists();
});

function updateBackLink() {
    if (backLink) {
        backLink.href = currentTab === 'books' ? 'books.html' : 'ocn.html';
        backLink.innerHTML = `<span class="material-symbols-outlined">arrow_back</span> ${currentTab === 'books' ? 'Books' : 'OCN'}`;
    }
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        sessionStorage.clear();
        alert('로그아웃되었습니다.');
        location.href = 'index.html';
    });
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

    // 제목순 정렬
    wishlists.sort((a, b) => (a.content_title || '').localeCompare(b.content_title || ''));

    const cardsHTML = wishlists.map(item => createWishlistCardHTML(item)).join('');
    wishlistContainer.innerHTML = cardsHTML;
}

function createWishlistCardHTML(item) {
    const title = item.content_title || '제목 없음';
    const image = item.content_image || 'https://via.placeholder.com/150x220?text=No+Image';

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

// 위시리스트 카드 클릭 이벤트
if (wishlistContainer) {
    wishlistContainer.addEventListener('click', async (event) => {
        // 하트 버튼 클릭 - 위시리스트에서 제거
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
                loadWishlists(); // 목록 새로고침
            }
            return;
        }
    });
}

// ESC 키로 모달 닫기 (혹시 모달 추가할 경우 대비)
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        // 현재는 모달 없음
    }
});