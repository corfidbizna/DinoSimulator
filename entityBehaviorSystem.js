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
        },
        interpolate: function(a, b, percent) {
            return Math.floor(((a - b) * percent) + b);
        },
        numberToHex: function(input) {
            // Currently only works for two digits of Hex. 
            // Meant for colors. 
            var number = input % 256;
            var hex = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, "a", "b", "c", "d", "e", "f" ];
            var first = Math.floor(number / 16);
            var second = (number % 16);
            var result = "";
            return (result + hex[first] + hex[second]); 
        },
        hungerLerpResult: function(dino) {
            // This should probably live somewhere else, but putting it here
            // was the fastest way to get it accessible to the svg. :/
            var cap = hungerTickCalc(dino);
            var current = dino.hungerTick;
            var percentRate = current / cap;
            var percentFood = dino.food / 10;
            var percent = percentFood + (percentRate * 0.1);
            var colorMax = [
                64,
                255,
                255,
                4,
            ];
            var colorMin = [
                255,
                64,
                64,
                16,
            ];
            var colorCurrent = [
                this.interpolate(colorMax[0], colorMin[0], percent),
                this.interpolate(colorMax[1], colorMin[1], percent),
                this.interpolate(colorMax[2], colorMin[2], percent),
                this.interpolate(colorMax[3], colorMin[3], percent),,
            ];
            var result = colorCurrent.join(", ");
            // return "rgba(" + result + ")";
            return "#" 
                + this.numberToHex(colorCurrent[0])
                + this.numberToHex(colorCurrent[1])
                + this.numberToHex(colorCurrent[2])
                + this.numberToHex(colorCurrent[3])
            ;
        },
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

var hungerTickCalc = function(dino) {
    return 1/(dino.speed * 0.03);
};

var spawnPlants = function (worldSize) {
    var newPlants = [];
    var plantChance = 0.1;
    if (Math.random() <= plantChance) {
        var plantPosition = getRandomWorldPosition(worldSize);
        newPlants.push({
            x: plantPosition.x,
            y: plantPosition.y,
            type: "plant",
            alive: true,
        })
    }
    return newPlants;
};

var tickEntitySystem = function (state) {
    var worldSize = state.worldSize;
    var newDinos = [];
    var newPlants = spawnPlants(worldSize);
    state.entities = state.entities.concat(newPlants);
    var dinos = state.entities.filter(function(entity) {
        return entity.type === "dino";
    });
    var plants = state.entities.filter(function(entity) {
        return entity.type === "plant";
    });
    dinos.forEach(function(dino) {
        var movementDestination;
        var closestPlantTarget = lookForClosestTarget(dino, plants);
        dino.hungerTick -= 1;
        if (dino.hungerTick <= 0) {
            dino.hungerTick = hungerTickCalc(dino);
            dino.food -= 1;
        }
        if(dino.behavior !== 'spawning') {
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
        }
        var actionHandlers = {
            'roaming': function() {
                if (!dino.roamTarget) {
                    dino.roamTarget = getRandomWorldPosition(worldSize)
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
                            dino.food += 1;
                            if (dino.food >= (state.foodRequiredToSpawn)) {
                                dino.behavior = 'spawning';
                            }
                        } else {
                            moveEntityTowardDestination(
                                dino,
                                closestPlantTarget.target
                            );
                        }
                    }
                }
            },
            'spawning': function() {
                dino.food -= state.foodRequiredToSpawn * 0.5;
                dino.behavior = 'roaming';
                var dinoName = dino.name.split(" ");
                var generation = 1;
                if (dinoName.length > 1) {
                    var generation = parseInt(dinoName[1], 10);
                }
                newDinos.push(Object.assign(
                    {},
                    dino,
                    {
                        visionRadius: dino.visionRadius + ((Math.random() - 0.5) * 5),
                        speed: dino.speed + ((Math.random() - 0.5) * 0.25),
                        score: 0,
                        food: state.foodRequiredToSpawn * 0.5,
                        name: dinoName[0] + " " + (generation+1),
                    }
                ))
            },
        };
        var action = actionHandlers[dino.behavior]
        if (action) {
            action();
        } else {
            console.log('This dino is actionless!', JSON.stringify(dino))
        }

        if (
            Math.abs(dino.x) >= worldSize ||
            Math.abs(dino.y) >= worldSize
        ) {
            dino.alive = false;
        }
        if (dino.food <= 0) {
            dino.alive = false;
        }
    });
    state.entities = state.entities
        .filter(function(entity) {
            return entity.alive;
        })
        .concat(newDinos);
}