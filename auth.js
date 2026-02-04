(() => {
    // sessionStorage에 이미 그룹 ID가 저장되어 있다면(로그인 상태), 아무것도 하지 않고 종료.
    const currentGroupId = sessionStorage.getItem('appGroupId');
    if (currentGroupId) {
        return;
    }

    // 그룹 ID가 없다면, 암호를 묻습니다.
    let password = null;
    let groupId = null;

    while (true) {
        password = prompt("암호를 입력하세요:");

        // 사용자가 '취소'를 누르거나 창을 닫은 경우
        if (password === null) {
            // 포털 홈으로 돌려보냅니다.
            alert("접근이 취소되었습니다. 메인 화면으로 돌아갑니다.");
            location.href = 'index.html';
            // 페이지를 이동시키므로, 이후의 스크립트 실행은 의미가 없어집니다.
            return; 
        }

        if (password === "수인지형") {
            groupId = "v1";
            break; // 올바른 암호, 반복문 탈출
        } else if (password === "coreda") {
            groupId = "v2";
            break; // 올바른 암호, 반복문 탈출
        } else {
            alert("암호가 올바르지 않습니다. 다시 시도해주세요.");
        }
    }
    
    // 올바른 암호를 입력했다면,
    if (groupId) {
        // 1. 그룹 ID를 sessionStorage에 저장합니다.
        sessionStorage.setItem('appGroupId', groupId);
        // 2. (가장 중요) 페이지를 강제로 새로고침합니다.
        // 이렇게 하면 다른 스크립트(ocn.js, mypage.js)가 실행될 때
        // sessionStorage에서 방금 저장된 groupId를 확실하게 읽을 수 있습니다.
        location.reload();
    }
})();