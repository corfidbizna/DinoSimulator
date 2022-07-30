var appTemplate = Vue.createApp({
    data: function() {
        return {
            entities: [
                {
                    x: -87,
                    y: 2,
                    type: "plant",
                },
                {
                    x: 15,
                    y: 88,
                    type: "plant",
                },
                {
                    x: 0,
                    y: 0,
                    type: "dino",
                },
            ],
        };
    },
    template: /* html */ `
<div>
    <svg 
        viewBox="-100 -100 200 200"
        style="
            max-height: 90vh;
            border: 2px solid #555;
        "
    >
        <rect 
            v-for="item in entities"
            :x="item.x"
            :y="item.y"
            height="10"
            width="10"
            :class="item.type"
        ></rect>
    </svg>
</div>
    `,
});

var app = appTemplate.mount("#app");
