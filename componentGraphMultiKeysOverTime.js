appTemplate.component('graph-multi-keys-over-time', {
    name: 'graph-multi-keys-over-time',
    mixins: [
        mathsMixin,
    ],
    props: {
        timeSeriesData: {
            type: Array,
            required: true,
        }
    },
    data: function () {
        return {
            height: 50,
            width: 200,
            padding: 5,
        }
    },
    computed: {
        viewBox: function () {
            return [
                0,
                -this.height,
                this.width,
                this.height,
            ].join(' ');
        },
        bounds: function () {
            var result = {
                valueMin: Infinity,
                valueMax: -Infinity,
                tickMin: Infinity,
                tickMax: -Infinity,
            };
            this.timeSeriesData.forEach(function (point) {
                result.valueMin = Math.min(result.valueMin, point.value);
                result.valueMax = Math.max(result.valueMax, point.value);
                result.tickMin = Math.min(result.tickMin, point.tick);
                result.tickMax = Math.max(result.tickMax, point.tick);
            });
            return result;
        },
        lines: function () {
            var bounds = this.bounds;
            var lines = {};
            var self = this;
            this.timeSeriesData.forEach(function (point) {
                var line = lines[point.key] || [];
                line.push(Object.assign(
                    self.getPositionAndTranslateForPoint(point, bounds),
                    point
                ));
                lines[point.key] = line;
            });
            return lines;
        },
        polyLines: function () {
            var lines = this.lines;
            return this.lineNames.map(function (lineName) {
                return lines[lineName]
                    .map(function (scaledPoint) {
                        return scaledPoint.x + ',' + scaledPoint.y;
                    })
                    .join(' ');
            });
        },
        lineNames: function () {
            return Object.keys(this.lines);
        },
        innerWidth: function () {
            return this.width - (this.padding * 2);
        }, 
        innerHeight: function () {
            return this.height - (this.padding * 2);
        },
        pointSize: function () {
            return this.height / 80;
        },
    },
    methods: {
        getPositionAndTranslateForPoint: function (point, bounds) {
            var xProgress = this.getProgressInRange(bounds.tickMin, bounds.tickMax, point.tick);
            var yProgress = this.getProgressInRange(bounds.valueMin, bounds.valueMax, point.value);
            var padding = this.padding;
            var position = {
                x: (xProgress * this.innerWidth) + padding,
                y: -((yProgress * this.innerHeight) + padding),
            }
            position.translate = this.createTranslateForTarget(position);
            return position;
        },
    },
    template: /* html */ `
<div
    class="graph-multi-keys-over-time"
>
    <h5>Time Series Data</h5>
    <svg
        v-if="timeSeriesData.length"
        :viewBox="viewBox"
    >
        <rect
            :width="width"
            :height="height"
            :y="-height"
            stroke="#555"
            stroke-weight="2"
        />
        <g
            v-for="(line, key, lineIndex) in lines"
            :key="key"
        >
            <text
                :x="padding + (padding / 4)"
                :y="-height + padding + (padding * lineIndex)"
                class="legend"
                :class="key"
            >{{ key }}: {{ line.length }}</text>
            <rect
                :x="padding / 2"
                :y="-height + (padding / 1.5) + (padding * lineIndex)"
                :class="key"
                :width="padding / 3"
                :height="padding / 3"
            />
            <polyline
                :points="polyLines[lineIndex]"
                class="stroke"
                :class="key + '-stroke'"
            />
    </svg>
</div>
    `
    /*
    I removed this from the end of the above multi-line String to try and improve performance. 
            <g
                class="points"
                :class="key"
            >
                <ellipse
                    v-for="(point, pointIndex) in line"
                    cx="0"
                    cy="0"
                    :rx="pointSize"
                    :ry="pointSize"
                    :transform="point.translate"
                />
            </g>
        </g>

        <text
            :x="width / 2"
            :y="-height / 2"
        >Data points: {{ timeSeriesData.length }}</text>
    */
})
