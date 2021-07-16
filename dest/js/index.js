(() => {
    let main = {
        init: () => {
            main.hello();
        },
        hello: () => {
            console.log("Test");
        }
    };

    $(document).ready(() => {
        main.init();
    });
})();
