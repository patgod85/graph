/*globals jQuery */

(function( $ ){

    var holderClassName = 'p85-graph-holder',
        fgId = 'p85GraphCanvasFg',
        bgId = 'p85GraphCanvasBg',
        statusBarId = 'p85GraphStatusBar';

    $.fn.graph = function(options, coords) {

        addLocalFormat();

        this.addClass(holderClassName);

        (new Style).appendTo(this);

        (new Graph(options, coords)).appendTo(this);

        (new StatusBar).appendTo(this);

        return this;
    };

    function Graph(options, coords){

        this.appendTo = function(container){
            var layers = [
                (new BackgroundLayer(options, params)).getCanvas(),
                (new PointsLayer(options)).getCanvas()
            ];

            for(var i = 0; i < layers.length; i++){
                container.append(layers[i]);
            }
        };

        options = setDefaultOptions(options);

        var params = getParams();

        var points = getPoints();

        function PointsLayer(options){

            this.getCanvas = function() {
                var canvas = createCanvas(fgId);
                var context = canvas.getContext('2d');
                var hoverStateGlobal = [];

                drawPlots();

                addListeners();

                function addListeners() {
                    canvas.addEventListener('mousemove', function (e) {
                        var mousePos = getMousePos(canvas, e);

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

                        if(options['debug']){
                            var statusBar = document.getElementById(statusBarId);
                            statusBar.innerHTML = message;
                        }
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
                                tooltip(context, point);
                            }else{
                                radius = 5;
                            }

                            context.setLineDash([0]);
                            context.lineWidth = 2;

                            rhomb(context, point, radius);

                            if(point.descr != ''){
                                context.beginPath();
                                context.font = 'bold 10pt Tahoma';
                                context.fillStyle = options.types[point.type].color;
                                context.fillText(point.descr, point.x - 10, point.y + 15);
                                context.closePath();
                            }

                        }
                    );
                }

                return canvas;
            };
        }

        //noinspection JSUnusedLocalSymbols
        function BackgroundLayer(options, params){

            this.getCanvas = function(){
                var canvas = createCanvas(bgId);
                var context = canvas.getContext('2d');

                drawBackground();

                drawCurve();

                drawAxes();

                drawAgenda();

                function drawBackground(){
                    context.fillStyle = options['backgroundColor'];
                    context.fillRect(0, 0, options['width'], options['height']);
                }

                function drawAgenda(){
                    context.lineWidth = 2;

                    for(var i = 0; i < options.types.length; i++){
                        rhomb(context, new Point(i, '', i * 120 + 100, 10, options, params, true), 5);

                        context.beginPath();
                        context.fillStyle = options['axesDescriptionColor'];
                        context.fillText(' - ' + options.types[i].description, i * 120 + 107, 14);
                        context.closePath();
                    }
                }

                function drawAxes(){

                    context.strokeStyle = options['axesColor'];
                    context.lineWidth = 1;
                    context.font = '8pt Arial';
                    context.fillStyle = options['axesDescriptionColor'];

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
                        context.fillText(date.format("%H:%M"), x, params['y0'] + 15);

                        if(i == 0 || currentDate != date.getDate()){
                            context.fillText(date.format("%d %B"), x, params['y0'] + 25);
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
                    //noinspection JSUnusedAssignment
                    context.lineTo(typeof firstX != 'undefined' ? firstX : 0, params['y0']);
                    context.fill();

                    context.closePath();
                }

                return canvas;
            };
        }

        function createCanvas(id){
            var canvas = document.createElement("canvas");

            canvas.setAttribute('height', options['height'] + 'px');
            canvas.setAttribute('width', options['width'] + 'px');
            canvas.setAttribute('id', id);

            return canvas;
        }

        function mapPoints(callback){
            for(var i = 0; i < points.length; i++){
                if(callback(points[i]) === false){
                    break;
                }
            }
        }
        function mapCoords(callback){
            for(var i = 0; i < coords.length; i++){
                var timestamp = Date.parse(coords[i][2]);

                callback(coords[i][0], coords[i][1], timestamp, coords[i][3]);
            }
        }

        function rhomb(context, point, radius){

            context.beginPath();
            context.fillStyle = options['linesColor'];
            context.strokeStyle = options['types'][point.type].color;
            context.moveTo(point.x - radius, point.y);
            context.lineTo(point.x, point.y - radius);
            context.lineTo(point.x + radius, point.y);
            context.lineTo(point.x, point.y + radius);
            context.lineTo(point.x - radius, point.y);
            context.fill();
            context.stroke();
            context.closePath();
        }

        function tooltip(context, point){
            context.beginPath();
            context.strokeStyle = options.types[point.type].color;
            context.lineWidth = 1;
            context.setLineDash([3]);
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
        }

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
                stepsX: 8,
                stepsY: 5,
                yK: 1.5,
                debug: false,
                types: [{color: '#39A8EC', description: 'ваша ставка'}, {color: '#0457AB', description: 'другая компания'}]
            };

            for(var i in _options){
                if(_options.hasOwnProperty(i)){
                    options[i] = _options[i];
                }
            }

            return options;
        }

        function getParams(){
            var maxX = 0,
                maxY = 0,
                minX = Number.MAX_VALUE,
                minY = Number.MAX_VALUE;

            mapCoords(
                function(type, descr, x, y){
                    maxX = Math.max(x, maxX);
                    maxY = Math.max(y, maxY);
                    minX = Math.min(x, minX);
                    minY = Math.min(y, minY);
                }
            );

            function getNearestPrettyDate(direction, value){
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

            minX = getNearestPrettyDate(false, minX);
            maxX = minX + getNearestPrettyDate(true, maxX - minX);

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

        function getPoints(){

            var points = [];
            mapCoords(
                function(type, descr, x, y){
                    points.push(
                        new Point(type, descr, x, y, options, params)
                    );
                }
            );
            return points;
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

    function addLocalFormat(){
        if(!Date.prototype.format){
            Date.prototype.format = function(format) {
                var monthNames = [ "Января", "Февраля", "Марта", "Апреля", "Мая", "Июня",
                    "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря" ];

                var f = {
                    Y : this.getFullYear(),
                    y : this.getFullYear()-(this.getFullYear()>=2e3?2e3:1900),
                    m : this.getMonth() + 1,
                    d : this.getDate(),
                    H : this.getHours(),
                    M : this.getMinutes(),
                    S : this.getSeconds(),
                    B : monthNames[this.getMonth()]
                }, k;
                for(k in f){
                    if(f.hasOwnProperty(k)){
                        format = format.replace('%' + k, f[k] < 10 ? "0" + f[k] : f[k]);
                    }
                }
                return format;
            }
        }
    }

    function Style(){
        this.appendTo = function(container){
            var style = document.createElement('style');
            style.setAttribute('type', 'text/css');
            style.innerHTML = '.p85-graph-holder {position: relative; border: 1px solid grey;} #' + fgId + ' {position: absolute; top:0; left:0;}';
            container.append(style);
        }
    }

    function StatusBar(){
        this.appendTo = function(container) {
            var statusBar = document.createElement('p');
            statusBar.setAttribute('id', statusBarId);
            container.append(statusBar);
        }
    }
})( jQuery );