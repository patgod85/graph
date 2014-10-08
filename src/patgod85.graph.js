/*globals jQuery */

(function( $ ){

    $.fn.graph = function(options, coords) {
        var style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.innerHTML = '#graph-holder {position: relative; border: 1px solid grey;} #myCanvasFg {position: absolute; top:0; left:0;}';

        this.append(style);

        var graphCanvas = new GraphsCollection(options, coords);
        var canvases = graphCanvas.getCanvases();

        for(var i = 0; i < canvases.length; i++){
            this.append(canvases[i]);
        }

        var statusBar = document.createElement('p');
        statusBar.setAttribute('id', 'graphStatusBar');
        this.append(statusBar);

        return this;
    };

    function GraphsCollection(options, coords){

        this.getCanvases = function(){
            return [
                (new BackgroundCanvas(options, params)).getCanvas(),
                (new PointsCanvas(options, params)).getCanvas()
            ];
        };

        function setDefaultOptions(_options){
            var options = {
                width: 1280,
                height: 1024,
                marginX: 50,
                marginY: 50,
                backgroundColor: 'white',
                axesColor: '#DEDEDE',
                axesDescriptionColor: '#979797',
                linesColor: '#D9F1FD',
                pointsColor: '#0457AB',
                stepsX: 8,
                stepsY: 5,
                yK: 1.5,
                types: [{color: '#39A8EC', description: 'ваша ставка'}, {color: '#0457AB', description: 'другая компания'}]
            };

            for(var i in _options){
                if(_options.hasOwnProperty(i)){
                    options[i] = _options[i];
                }
            }

            return options;
        }

        options = setDefaultOptions(options);

        var params = getParams();

        function getParams(){
            var maxX = 0,
                maxY = 0,
                minX = Number.MAX_VALUE,
                minY = Number.MAX_VALUE;

            mapCoords(
                coords,
                function(type, descr, x, y){
                    maxX = Math.max(x, maxX);
                    maxY = Math.max(y, maxY);
                    minX = Math.min(x, minX);
                    minY = Math.min(y, minY);
                }
            );

            function getNearestStraightDate(direction, value){
                var date = new Date();
                date.setTime(value);
                while(date.getMinutes() != 0 || (date.getHours() - 1) % (options['stepsY'] - 1) != 0){
                    if(direction){
                        value += 60000;
                    }else{
                        value -= 60000;
                    }
                    date.setTime(value);
                }
                return value;
            }

            minX = getNearestStraightDate(false, minX);
            maxX = minX + getNearestStraightDate(true, maxX - minX);

            var coefficientX = (options['width'] - options['marginX'] * 2) / (maxX - minX);
            var stepTime = (maxX - minX) / options['stepsX'];
            return {
                coefficientX: coefficientX,
                coefficientY: (options['height']/options['yK'] - options['marginY'] * 2) / (maxY - minY),
                x0: parseInt(options['marginX'], 10),
                y0: options['height'] - options['marginY'],
                minX: minX,
                minY: minY,
                stepTime: stepTime,
                stepX: stepTime * coefficientX,
                stepY: (options['height'] - options['marginY'] * 2) / options['stepsY']
            };
        }

        var points = getPoints();

        function getPoints(){

            var points = [];
            mapCoords(
                coords,
                function(type, descr, x, y){
                    points.push(
                        new Point(type, descr, x, y, options, params)
                    );
                }
            );
            return points;
        }

        function PointsCanvas(options, params){
            var parentCanvas = new Canvas(options, params);

            parentCanvas.getCanvas = function() {
                var self = this;
                var canvas = self.createCanvas('myCanvasFg');
                var context = canvas.getContext('2d');
                var hoverStateGlobal = [];

                drawPlots();

                addListeners();

                function addListeners() {
                    canvas.addEventListener('mousemove', function (e) {
                        var mousePos = getMousePos(canvas, e);
                        var statusBar = document.getElementById('graphStatusBar');

                        var hoveredPoint = null;
                        var hoverStateCurrent = [];

                        mapPoints(function(point){
                            if(Math.abs(mousePos.x - point.x) < 8 && Math.abs(mousePos.y - point.y) < 8){
                                hoveredPoint = point;
                                point.hovered = true;
                            }else{
                                point.hovered = false;
                            }
                            hoverStateCurrent.push(point.hovered);
                        });

                        var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y;

                        if(hoveredPoint){
                            message += '. Hovered point!' + hoveredPoint.x + ' : ' + hoveredPoint.y;
                        }

                        if(hoverStateCurrent.toString() != hoverStateGlobal.toString()){
                            drawPlots();
                        }

                        hoverStateGlobal = hoverStateCurrent;

                        statusBar.innerHTML = message;
                    }, false);
                }

                function getMousePos(canvas, e) {
                    var rect = canvas.getBoundingClientRect();
                    return {
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                    };
                }

                function drawPlots() {

                    context.clearRect(0, 0, canvas.width, canvas.height);

                    mapPoints(
                        function (point) {

                            var radius;

                            if(point.hovered){
                                radius = 10;

                                context.beginPath();
                                context.strokeStyle = options['pointsColor'];
                                context.lineWidth = 1;
                                context.setLineDash([5]);
                                context.moveTo(params['x0'], point.y);
                                context.lineTo(point.x, point.y);
                                context.lineTo(point.x, params['y0']);
                                context.stroke();

                                context.closePath();

                                context.beginPath();
                                context.setLineDash([0]);
                                context.fillStyle = options.types[point.type].color;
                                context.strokeStyle = options.types[point.type].color;
                                context.moveTo(point.x, point.y - 14);
                                context.lineTo(point.x - 8, point.y - 20);
                                context.lineTo(point.x + 8, point.y - 20);
                                context.lineTo(point.x, point.y - 14);
                                context.fill();

                                context.rect(point.x - 30, point.y - 40, 60, 20);
                                context.fill();

                                context.stroke();

                                context.closePath();

                                context.beginPath();
                                context.fillStyle = 'white';
                                context.font = 'bold 10pt Tahoma';
                                context.fillText(point.origY.toString(), point.x - 20, point.y - 25);
                                context.stroke();

                                context.closePath();
                            }else{
                                radius = 5;
                            }

                            context.beginPath();
                            context.setLineDash([0]);
                            context.strokeStyle = options['pointsColor'];
                            context.lineWidth = 2;
                            //context.arc(point.x, point.y, radius, 0, 2 * Math.PI, false);

                            rhomb(context, point, radius);
                            context.closePath();

                            if(point.descr != ''){
                                context.beginPath();
                                context.font = 'bold 10pt Tahoma';
                                context.fillStyle = options.types[point.type].color;
                                context.fillText(point.descr, point.x - 10, point.y + 15);
                                context.closePath();
                            }

                        }
                    );

                    //console.log('Plots rewritted!');
                }

                return canvas;
            };

            return parentCanvas;
        }

        //noinspection JSUnusedLocalSymbols
        function BackgroundCanvas(options, params){

            var parentCanvas = new Canvas(options, params);

            parentCanvas.getCanvas = function(){
                var self = this;
                var canvas = self.createCanvas('myCanvasBg');
                var context = canvas.getContext('2d');

                context.fillStyle = options['backgroundColor'];
                context.fillRect(0, 0, options['width'], options['height']);

                drawCurve();

                drawAxes();

                drawAgenda();

                function drawAgenda(){
                    context.beginPath();
                    context.lineWidth = 2;

                    for(var i = 0; i < options.types.length; i++){
                        context.beginPath();

                        rhomb(context, new Point(i, '', i * 120 + 100, 10, options, params, true), 5);
                        context.closePath();

                        context.beginPath();
                        context.fillStyle = options['axesDescriptionColor'];
                        context.fillText(' - ' + options.types[i].description, i * 120 + 107, 14);
                        context.closePath();
                    }

                }

                function drawAxes(){

                    context.strokeStyle = options['axesColor'];
                    context.lineWidth = 1;
                    context.font = 'italic 8pt Arial';
                    context.fillStyle = options['axesDescriptionColor'];

                    //context.beginPath();
                    //mapPoints(
                    //    function(point){
                    //        context.moveTo(params['x0'], point.y);
                    //        context.lineTo(params['x0'] + 5, point.y);
                    //        context.stroke();
                    //
                    //        context.fillText(point.origY + ' Km', 10, point.y);
                    //
                    //        context.moveTo(point.x, params['y0']);
                    //        context.lineTo(point.x, params['y0'] - 5);
                    //        context.stroke();
                    //
                    //        var date = new Date();
                    //        date.setTime(point.origX);
                    //        context.fillText(date.toLocaleFormat("%H:%M"), point.x, params['y0'] + 15);
                    //    }
                    //);
                    //context.closePath();

                    var i, currentDate = 0;


                    for(i = 0; i < options['stepsX']; i++){
                        var x = params['x0'] + i * params['stepX'];

                        context.beginPath();
                        context.moveTo(x, params['y0']);
                        context.lineTo(x, params['y0'] - options['height'] + options['marginY'] * 2);
                        context.stroke();
                        context.closePath();

                        var date = new Date();
                        date.setTime(params['minX'] + i* params['stepTime']);
                        context.fillText(date.toLocaleFormat("%H:%M"), x, params['y0'] + 15);

                        if(i == 0 || currentDate != date.getDate()){
                            context.fillText(date.toLocaleFormat("%d %B"), x, params['y0'] + 25);
                        }
                        currentDate = date.getDate();
                    }

                    for(i = 0; i < options['stepsY']; i++){
                        var y = params['y0'] - i * params['stepY'];

                        context.beginPath();
                        context.moveTo(params['x0'], y);
                        context.lineTo(params['x0'] + options['width'] - options['marginX'] * 2, y);
                        context.stroke();
                        context.closePath();
                    }


                    context.beginPath();

                    context.lineWidth = 1;
                    context.moveTo(params['x0'], options['marginY']);
                    context.lineTo(params['x0'], params['y0']);
                    context.lineTo(options['width'] - options['marginX'], params['y0']);
                    context.stroke();

                    context.closePath();
                }

                function drawCurve(){
                    context.beginPath();

                    context.fillStyle = options['linesColor'];
                    context.strokeStyle = options['linesColor'];

                    var firstX, lastX = 0;


                    mapPoints(
                        function(point){
                            if(typeof firstX == 'undefined'){
                                firstX = point.x;
                            }

                            context.lineTo(point.x, point.y);
                            lastX = point.x;
                        }
                    );

                    context.lineWidth = 2;
                    context.stroke();

                    context.lineTo(lastX, params['y0']);
                    context.lineTo(typeof firstX != 'undefined' ? firstX : 0, params['y0']);
                    context.fill();

                    context.closePath();
                }



                return canvas;
            };

            return parentCanvas;
        }

        function Canvas(options){

            var self = this;

            self.getCanvas = function(){};

            self.createCanvas = function(id){
                var canvas = document.createElement("canvas");

                canvas.setAttribute('height', options['height'] + 'px');
                canvas.setAttribute('width', options['width'] + 'px');
                canvas.setAttribute('id', id);

                return canvas;
            }
        }

        function mapPoints(callback){
            for(var i = 0; i < points.length; i++){
                if(callback(points[i]) === false){
                    break;
                }
            }
        }
        function mapCoords(coords, callback){
            for(var i = 0; i < coords.length; i++){
                var timestamp = Date.parse(coords[i][2]);

                callback(coords[i][0], coords[i][1], timestamp, coords[i][3]);
            }
        }

        function rhomb(context, point, radius){
            context.fillStyle = options['linesColor'];

            context.strokeStyle = options['types'][point.type].color;

            context.moveTo(point.x - radius, point.y);
            context.lineTo(point.x, point.y - radius);
            context.lineTo(point.x + radius, point.y);
            context.lineTo(point.x, point.y + radius);
            context.lineTo(point.x - radius, point.y);
            context.fill();
            context.stroke();
        }
    }

    function Point(type, descr, origX, origY, options, params, force){
        var x;
        var y;

        if(force){
            x = origX;
            y = origY;
        }else{
            x = params['coefficientX'] * (origX - params['minX']) + options['marginX'];
            y = options['height']/options['yK'] - params['coefficientY'] * (origY - params['minY']) - options['marginY'];
        }
        return {
            origX: origX,
            origY: origY,
            x: x,
            y: y,
            hovered: false,
            type: type,
            descr: descr
        }
    }
})( jQuery );