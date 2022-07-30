var appTemplate = Vue.createApp({
    data: function() {
        return {
            plantCount: 5,
        };
    },
    template: /* html */ `
        <div>{{plantCount}}</div>
    `,
});

var app = appTemplate.mount("#app");
