var maths = {
    getLength: function (x, y) { return Math.sqrt((x * x) + (y * y)) },
    getAngleAndDistance: function (a, b) {
        const diffX = a.x - b.x;
        const diffY = a.y - b.y;
        return {
            distance: maths.getLength(diffX, diffY),
            angle: Math.atan2(-diffY, -diffX),
        };
    },
    tau: Math.PI * 2
}

var mathsMixin = {
    computed: {
        tau: function () {
            return maths.tau;
        },
    },
    methods: {
        convertRadianToDegree: function (radian) {
            return (radian / maths.tau) * 360;
        },
    },
};

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
                    x: -10,
                    y: 10,
                    type: "plant",
                    alive: true,
                },
                {
                    x: 0,
                    y: 0,
                    type: "dino",
                    score: 0,
                    speed: 0.3,
                    angle: 0,
                    alive: true,
                },
            ],
        };
    },
    created: function () {
        setInterval(this.doTick, 1000 / 60);
    },
    methods: {
        doTick: function () {
            var self = this;
            var dinos = this.entities.filter(function(entity) {
                return entity.type === "dino";
            });
            var plants = this.entities.filter(function(entity) {
                return entity.type === "plant";
            });
            dinos.forEach(function(dino) {
                if (plants.length) {
                    var closestPlantVector = maths.getAngleAndDistance(dino, plants[0]);
                    var currentClosestPlant = plants[0];
                    plants.slice(1).forEach(function(plant) {
                        var newVector = maths.getAngleAndDistance(dino, plant);
                        if(newVector.distance < closestPlantVector.distance) {
                            closestPlantVector = newVector;
                            currentClosestPlant = plant;
                        }
                    });
                    dino.angle = closestPlantVector.angle;
                    // move to eat plant?
                    if (closestPlantVector.distance <= 1) {
                        currentClosestPlant.alive = false;
                        dino.score += 1;
                        console.log("Dino Score: " + dino.score);
                    } else {
                        var dinoMovementAmount = Math.min(
                            closestPlantVector.distance,
                            dino.speed
                        )
                        var dinoMovementVector = {
                            x: Math.cos(dino.angle) * dinoMovementAmount,
                            y: Math.sin(dino.angle) * dinoMovementAmount
                        }
                        dino.x += dinoMovementVector.x;
                        dino.y += dinoMovementVector.y;
                    }
                }
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
            :value="item"
            :transform="'translate(' + item.x + ',' + item.y + ')'"
        ></component>
    </svg>
</div>
    `,
});

appTemplate.component('dino', {
    name: 'dino',
    mixins: [
        mathsMixin,
    ],
    props: {
        value: {
            type: Object,
            required: true
        }
    },
    template: /* svg */ `
<g
    class="dino"
>
    <polyline
        points="5,5 0,-5 -5, 5 5, -5"
    />
    <polyline
        points="0,0 5,0"
        stroke="#fff"
        stroke-width="2"
        :transform="'rotate(' + convertRadianToDegree(value.angle) + ')'"
    />
    <text
        y="-5"
    >score: {{value.score}}</text>
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
