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
        createTranslateForTarget: function (target) {
            return 'translate(' + target.x + ',' + target.y + ')'
        }
    },
};

var moveEntityTowardDestination = function (entity, destination) {
    if (!entity.speed) {
        throw new Error('Entity ' + JSON.stringify(entity) + ' tried moving but doesn\'t have a speed!!!!');
    }
    var differenceVector = maths.getAngleAndDistance(entity, destination);
    entity.angle = differenceVector.angle;
    var dinoMovementAmount = Math.min(
        differenceVector.distance,
        entity.speed
    )
    var dinoMovementVector = {
        x: Math.cos(entity.angle) * dinoMovementAmount,
        y: Math.sin(entity.angle) * dinoMovementAmount
    }
    entity.x += dinoMovementVector.x;
    entity.y += dinoMovementVector.y;
}

var lookForClosestTarget = function (entity, targets) {
    var result;
    if (targets.length) {
        var closestTargetVector = maths.getAngleAndDistance(entity, targets[0]);
        var currentClosestTarget = targets[0];
        targets.slice(1).forEach(function(target) {
            var newVector = maths.getAngleAndDistance(entity, target);
            if(newVector.distance < closestTargetVector.distance) {
                closestTargetVector = newVector;
                currentClosestTarget = target;
            }
        });
        result = {
            target: currentClosestTarget,
            vector: closestTargetVector,
        }
    }
    return result
}
var getRandomWorldPosition = function (worldSize) {
    return {
        x: (Math.random() - 0.5) * worldSize * 2,
        y: (Math.random() - 0.5) * worldSize * 2,
    }
};

var appTemplate = Vue.createApp({
    data: function() {
        var worldSize = 100;
        return {
            currentTick: 0,
            worldSize: worldSize, 
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
                    name: "Spot",
                    score: 0,
                    speed: 0.3,
                    angle: 0,
                    visionRadius: 40,
                    behavior: 'roaming',
                    alive: true,
                    roamTarget: null,
                },
                {
                    x: 60,
                    y: -21,
                    type: "dino",
                    name: "Speedy",
                    score: 0,
                    speed: 0.5,
                    angle: 0,
                    visionRadius: 20,
                    behavior: 'roaming',
                    alive: true,
                    roamTarget: null,
                },
            ],
        };
    },
    created: function () {
        setInterval(this.doTick, 1000 / 60);
    },
    methods: {
        spawnPlants: function () {
            var plantChange = 0.01;
            if (Math.random() <= plantChange) {
                var plantPosition = getRandomWorldPosition(this.worldSize);
                this.entities.push({
                    x: plantPosition.x,
                    y: plantPosition.y,
                    type: "plant",
                    alive: true,
                })
            }
        },
        doTick: function () {
            var self = this;
            this.currentTick += 1;
            this.spawnPlants();
            var dinos = this.entities.filter(function(entity) {
                return entity.type === "dino";
            });
            var plants = this.entities.filter(function(entity) {
                return entity.type === "plant";
            });
            dinos.forEach(function(dino) {
                var movementDestination;
                var closestPlantTarget = lookForClosestTarget(dino, plants);
                if (
                    closestPlantTarget &&
                    closestPlantTarget.vector.distance < dino.visionRadius
                ) {
                    dino.roamTarget = null;
                    dino.behavior = 'foodGetting';
                    movementDestination = closestPlantTarget.vector;
                } else {
                    dino.behavior = 'roaming'
                }

                var actionHandlers = {
                    'roaming': function() {
                        if (!dino.roamTarget) {
                            dino.roamTarget = getRandomWorldPosition(self.worldSize)
                        }
                        var angleAndDistanceToRoamTarget = maths.getAngleAndDistance(dino, dino.roamTarget);
                        if (angleAndDistanceToRoamTarget.distance <= 1) {
                            dino.roamTarget = null
                        } else {
                            moveEntityTowardDestination(
                                dino,
                                dino.roamTarget
                            );
                        }
                    },
                    'foodGetting': function() {
                        if (plants.length) {
                            // move to eat plant?
                            if(closestPlantTarget) {
                                if (closestPlantTarget.vector.distance <= 1) {
                                    closestPlantTarget.target.alive = false;
                                    dino.score += 1;
                                } else {
                                    moveEntityTowardDestination(
                                        dino,
                                        closestPlantTarget.target
                                    );
                                }
                            }
                        }
                    },
                };
                var action = actionHandlers[dino.behavior]
                if (action) {
                    action()
                } else {
                    console.log('This dino is actionless!', JSON.stringify(dino))
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
        <p>Stats. current tick: {{currentTick}} Entities: {{entities.length}}</p>
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
    <g
        class="inside"
        :transform="createTranslateForTarget(value)"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20px"
            height="20px"
            version="1.1"
            viewBox="0 0 752 752"
            x="-10"
            y="-10"
        >
        <defs>
        <clipPath id="a">
        <path d="m139.21 269h473.58v214h-473.58z"/>
        </clipPath>
        </defs>
        <g clip-path="url(#a)">
        <path d="m611.57 368c-5.6758-1.2148-11.551-2.4336-17.227-3.6484 5.0664-0.8125 12.969-1.8242 16.617-5.6758 5.875-6.0781-3.8516-16.008-9.1172-18.848-8.918-4.8633-20.266-4.8633-30.195-4.2539-8.918 0.60938-17.227 7.9023-18.645 16.82-1.0117 6.4844-2.0273 12.969-3.4453 19.25 0 0.40625 0 1.0117-0.40625 1.418-0.20312 0.60938-0.60938 1.0117-1.0117 1.418-4.8633 4.8633-13.578 8.7148-20.062 11.145-5.4727 2.0273-11.348 3.4453-17.227 3.4453-9.1172 0-17.629-3.8516-24.316-10.133-5.4727-5.2695-9.7266-11.754-12.766-18.441-1.418-3.0391-3.0391-5.4727-3.4453-8.918-0.40625-3.2422 0.40625-6.4844 0.60938-9.7266 0.40625-4.2539 0.60938-8.5117 1.0117-12.969 0-1.2148 1.2148-17.629 1.6211-17.629-14.996 1.6211-29.789 3.0391-44.785 4.6602-0.8125 0-1.6211-0.40625-1.8242-1.2148l-9.1172-31.816-31.004 16.414s-1.6211 0-2.2305-0.40625l-21.887-29.789-19.859 32.219s-1.6211 1.0117-2.4336 0.40625l-29.789-22.492-8.3086 33.641s-1.0117 1.418-2.0273 1.2148l-27.559-4.6602c-2.4336 14.996-3.0391 31.41-9.7266 45.191-8.918 18.238-19.656 39.312-41.949 42.555-14.59 2.2305-29.586-4.0547-41.949-11.145-10.539-5.875-40.125-27.559-40.125-27.559 1.8242 1.418 3.2422 8.5117 4.2539 10.539 2.8359 6.6875 6.2812 13.172 9.7266 19.656 6.8906 12.562 14.996 25.129 26.953 33.438 9.7266 6.8906 21.48 10.133 33.234 12.969 14.996 3.4453 30.195 6.0781 45.391 5.875 4.6602 0 9.3203-0.40625 13.984-0.8125 3.8516-0.40625 4.0547 0.20313 3.6484 3.6484-0.60938 4.8633-1.418 9.7266-2.2305 14.59-1.2148 7.6992-2.4336 15.199-3.4453 22.695l33.641 1.418v-37.691h6.2812l2.6328 37.691h31.207v-35.867c28.574 4.0547 42.352-9.1172 42.352-9.1172l-1.6211 44.988h38.504l-6.4844-44.176 12.16-1.418 13.375 45.594h25.535l-4.6602-45.391 45.391-5.2695c13.781-2.0273 27.559-5.6758 40.328-11.754 17.227-8.5117 31.816-22.09 37.895-40.527 3.0391-0.40625 5.875-0.60938 8.918-1.0117 2.4336-0.40625 5.0664-0.8125 7.4961-1.6211 2.2305-0.60937 5.0664-1.2148 6.6875-3.0391 1.418-1.418 1.6211-3.4453 2.0273-5.2695v-0.60938s-0.40625-0.20312-0.60938-0.40625zm-37.086-9.9297c-2.0273 0-3.6484-1.6211-3.6484-3.6484 0-2.0273 1.6211-3.6484 3.6484-3.6484 2.0273 0 3.6484 1.6211 3.6484 3.6484 0 2.0273-1.6211 3.6484-3.6484 3.6484z"/>
        </g>
        </svg>
        <polyline
            points="0,0 5,0"
            stroke="#fff4"
            stroke-width="1"
            stroke-linecap="round"
            :transform="'rotate(' + convertRadianToDegree(value.angle) + ')'"
        />
        <ellipse
            cx="0"
            cy="0"
            :rx="value.visionRadius"
            :ry="value.visionRadius"
            fill="#ffffff08"
        />
        <text
            y="-2"
        >dino: {{value.name}}</text>
        <text
            y="-5"
        >score: {{value.score}}</text>
        <text
            y="-8"
        >behavior: {{value.behavior}}</text>
        <ellipse
            cx="0"
            cy="0"
            rx="1"
            ry="1"
        />
    </g>
    <g
        class="outside"
    >
        <g
            v-if="value.roamTarget"
            class="roam-target"
            :transform="createTranslateForTarget(value.roamTarget)"
        >
            <text
                y="-2"
            >dino: {{value.name}}</text>
            <ellipse
                cx="0"
                cy="0"
                rx="1"
                ry="1"
                fill="#800"
            />
        </g>
    </g>
</g>
    `
})

appTemplate.component('plant', {
    name: 'plant',
    mixins: [
        mathsMixin,
    ],
    props: {
        value: {
            type: Object,
            required: true,
        }
    },
    template: /* svg */ `
<g
    class="plant"
    :transform="createTranslateForTarget(value)"
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
