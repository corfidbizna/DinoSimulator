var appTemplate = Vue.createApp({
    data: function() {
        return {
            worldSize: 100, 
            entities: [
                {
                    x: -87,
                    y: 2,
                    type: "plant",
                    alive: true,
                },
                {
                    x: 15,
                    y: 88,
                    type: "plant",
                    alive: true,
                },
                {
                    x: 0,
                    y: 0,
                    type: "dino",
                    alive: true,
                },
            ],
        };
    },
    methods: {
        doTick: function () {
            var self = this;
            var dinos = this.entities.filter(function(entity) {
                return entity.type === "dino";
            });
            dinos.forEach(function(dino) {
                // what do we do with each entity?
                dino.x += 10;
                if (
                    Math.abs(dino.x) >= self.worldSize ||
                    Math.abs(dino.y) >= self.worldSize
                ) {
                    dino.alive = false;
                }
            });
            this.entities = this.entities.filter(function(entity) {
                return entity.alive;
            });
        }
    },
    computed: {
        viewBox: function () {
            return [
                -this.worldSize,
                -this.worldSize,
                this.worldSize * 2,
                this.worldSize * 2,
            ].join(' ');
        }
    },
    template: /* html */ `
<div>
    <div>
        <button
            @click="doTick"
        >doTick</button>
        <p>Stats. Entities: {{entities.length}}</p>
    </div>
    <svg 
        :viewBox="viewBox"
        style="
            max-height: 90vh;
            border: 2px solid #555;
        "
    >
        <component
            v-for="item in entities"
            :is="item.type"
            :transform="'translate(' + item.x + ',' + item.y + ')'"
        ></component>
    </svg>
</div>
    `,
});

appTemplate.component('dino', {
    name: 'dino',
    template: /* svg */ `
<g
    class="dino"
>
    <polyline
        points="5,5 0,-5 -5, 5 5, -5"
    />
    <ellipse
        cx="0"
        cy="0"
        rx="1"
        ry="1"
    />
</g>
    `
})

appTemplate.component('plant', {
    name: 'plant',
    template: /* svg */ `
<g
    class="plant"
>
    <polyline
        points="5,5 0,-5 -5, 5"
    />
    <ellipse
        cx="0"
        cy="0"
        rx="1"
        ry="1"
    />
</g>
    `
})

var app = appTemplate.mount("#app");
