const supabaseUrl = 'https://bmmhrilwjgfbcaefguyx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbWhyaWx3amdmYmNhZWZndXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTY3NTMsImV4cCI6MjA4NTY3Mjc1M30.KdBImt3wsO5XgZJqaHh1sfnB1rA3sMUbHOxUQ8Qn5Dk'; 
const { createClient } = supabase; // Supabase 라이브러리에서 createClient 함수를 가져옵니다.
const supabaseClient = createClient(supabaseUrl, supabaseKey); // 가져온 함수를 사용합니다.

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const errorMessage = document.getElementById('error-message');

// 페이지 로드 시, 이미 로그인 세션이 있으면 바로 ocn.html로 보냄
(async () => {
    // ✨ [수정] supabase -> supabaseClient
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        location.href = 'ocn.html';
    }
})();

if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        if(errorMessage) errorMessage.textContent = '';
        // ✨ [수정] supabase -> supabaseClient
        const { error } = await supabaseClient.auth.signInWithPassword({
            email: emailInput.value,
            password: passwordInput.value,
        });
        if (error) {
            if(errorMessage) errorMessage.textContent = '이메일 또는 비밀번호가 올바르지 않습니다.';
        } else {
            location.href = 'ocn.html';
        }
    });
}

if (signupBtn) {
    signupBtn.addEventListener('click', async () => {
        if(errorMessage) errorMessage.textContent = '';
        // ✨ [수정] supabase -> supabaseClient
        const { data, error } = await supabaseClient.auth.signUp({
            email: emailInput.value,
            password: passwordInput.value,
        });
        if (error) {
            if(errorMessage) errorMessage.textContent = '회원가입에 실패했습니다. (비밀번호는 6자 이상이어야 합니다)';
        } else {
            alert('회원가입 성공! 가입하신 정보로 로그인 해주세요.');
            // 회원가입 성공 시 입력 필드 초기화 (선택 사항)
            emailInput.value = '';
            passwordInput.value = '';
        }
    });
}