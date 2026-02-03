(() => {
    const currentGroupId = sessionStorage.getItem('appGroupId');
    if (currentGroupId) { return; }
    let password = null;
    let groupId = null;
    while (true) {
        password = prompt("암호를 입력하세요:");
        if (password === null) {
            document.body.innerHTML = '<h1 style="color: white; text-align: center; margin-top: 50px;">접근이 거부되었습니다.</h1>';
            throw new Error("Authentication Canceled");
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
    }
})();