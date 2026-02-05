(function() {
    var currentGroupId = sessionStorage.getItem('appGroupId');
    if (currentGroupId) {
        return;
    }

    var password = null;
    var groupId = null;

    while (true) {
        password = prompt("암호를 입력하세요:");

        if (password === null) {
            alert("접근이 취소되었습니다. 메인 화면으로 돌아갑니다.");
            location.href = 'index.html';
            return;
        }

        if (password === "수인지형") {
            groupId = "v1";
            break;
        } else if (password === "coreda") {
            groupId = "v2";
            break;
        } else {
            alert("암호가 올바르지 않습니다. 다시 시도해주세요.");
        }
    }
    
    if (groupId) {
        sessionStorage.setItem('appGroupId', groupId);
        location.reload();
    }
})();