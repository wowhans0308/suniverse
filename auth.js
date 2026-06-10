(function() {
    var currentGroupId = sessionStorage.getItem('appGroupId');
    var currentUserId = sessionStorage.getItem('appUserId');
    if (currentGroupId && currentUserId) {
        return;
    }

    var password = null;
    var groupId = null;
    var userId = null;

    while (true) {
        password = prompt("비밀번호를 입력하세요:");

        if (password === null) {
            alert("접근이 취소되었습니다. 메인 화면으로 돌아갑니다.");
            location.href = 'index.html';
            return;
        }

        if (password === "jihyung") {
            groupId = "v1";
            userId = "me";
            break;
        } else if (password === "suin") {
            groupId = "v1";
            userId = "partner";
            break;
        } else {
            alert("암호가 올바르지 않습니다. 다시 시도해주세요.");
        }
    }

    if (groupId) {
        sessionStorage.setItem('appGroupId', groupId);
        sessionStorage.setItem('appUserId', userId);
        location.reload();
    }
})();
