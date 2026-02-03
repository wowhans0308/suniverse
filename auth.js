(() => {
    // sessionStorage에서 'groupId'를 확인
    const currentGroupId = sessionStorage.getItem('appGroupId');

    // 이미 그룹 ID가 있다면(로그인 상태), 함수를 즉시 종료
    if (currentGroupId) {
        return;
    }

    let password = null;
    let groupId = null;

    while (true) {
        password = prompt("암호를 입력하세요:");
        if (password === null) {
            document.body.innerHTML = '<h1 style="color: white; text-align: center; margin-top: 50px;">접근이 거부되었습니다.</h1>';
            return;
        }

        if (password === "수인지형") {
            groupId = "v1"; // 'v1' 그룹
            break;
        } else if (password === "coreda") {
            groupId = "v2"; // 'v2' 그룹
            break;
        } else {
            alert("암호가 올바르지 않습니다. 다시 시도해주세요.");
        }
    }
    
    // 올바른 암호를 입력했다면, 그룹 ID를 sessionStorage에 저장
    if (groupId) {
        sessionStorage.setItem('appGroupId', groupId);
    }
})();