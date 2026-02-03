(() => {
    const currentVersionPrefix = sessionStorage.getItem('appVersionPrefix');
    if (currentVersionPrefix) { return; }
    let password = null;
    let versionPrefix = null;
    while (true) {
        password = prompt("암호를 입력하세요:");
        if (password === null) {
            document.body.innerHTML = '<h1 style="color: white; text-align: center; margin-top: 50px;">접근이 거부되었습니다.</h1>';
            return;
        }
        if (password === "수인지형") {
            versionPrefix = "v1_";
            break;
        } else if (password === "coreda") {
            versionPrefix = "v2_";
            break;
        } else {
            alert("암호가 올바르지 않습니다. 다시 시도해주세요.");
        }
    }
    if (versionPrefix) {
        sessionStorage.setItem('appVersionPrefix', versionPrefix);
    }
})();