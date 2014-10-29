/*globals jQuery */

(function( $ ){

    var holderClassName = 'p85-graph-holder',
        fgClassName = 'p85GraphCanvasFg',
        bgClassName = 'p85GraphCanvasBg',
        statusBarClassName = 'p85GraphStatusBar';

    $.fn.graph = function(options, coords, methodName) {

        if(methodName === 'internals'){
            return Graph;
        }

        if(typeof options === 'undefined'){
            options = {};
        }

        if(typeof coords === 'undefined'){
            return this;
        }

        addLocalFormat();

        this.addClass(holderClassName);

        (new Graph(options, coords)).appendTo(this);

        (new StatusBar).appendTo(this);

        return this;
    };

    function Graph(options, coords){

        this.appendTo = function(container){
            var layers = [
                (new BackgroundLayer(options, params)).getCanvas(),
                (new AgendaLayer(options)).getCanvas(),
                (new PointsLayer(options)).getCanvas(),
                (new Style(options)).getElement()
            ];

            for(var i = 0; i < layers.length; i++){
                container.append(layers[i]);
            }
        };

        this.getInternals = function(){
            return {
                timeToX: timeToX,
                xToTime: xToTime,
                params: params
            };
        };

        options = setDefaultOptions(options);

        var params = getParams();

        var points = getPoints();

        function PointsLayer(options){

            this.getCanvas = function() {
                var fgDiv = $('<div class="'+ fgClassName +'"></div>');

                drawPlots(fgDiv);

                return fgDiv;
            };

            function drawPlots(fgDiv) {

                function showTooltip(){
                    var tooltip = $('<div></div>');
                    tooltip.addClass('patgod85-graph-tooltip');
                    var css = {left: this.point.x, top: this.point.y - 40};

                    css['background-color'] = options.types[this.point.type].color;

                    tooltip.css(css);
                    tooltip.html(this.point.origY);
                    var parent = $(this).parents('.' + fgClassName);
                    tooltip.appendTo(parent);

                    var lines = $('<div></div>');
                    lines.addClass('patgod85-graph-tooltip-lines');
                    lines.css({
                        left: params['x0'],
                        top: this.point.y,
                        width: this.point.x - params['x0'],
                        height: params['y0'] - this.point.y
                    });

                    lines.appendTo(parent);
                }

                function hideTooltip(){
                    $('.patgod85-graph-tooltip').remove();
                    $('.patgod85-graph-tooltip-lines').remove();
                }

                mapPoints(
                    function (point) {

                        var pointElement = $(template('rhomb-tmpl-a'));
                        var css = {
                            top: point.y,
                            left: point.x
                        };

                        pointElement.addClass('p85-graph-point-type' + point.type);
                        pointElement.css(css);
                        pointElement.prop('point', point);
                        pointElement.hover(showTooltip, hideTooltip);
                        pointElement.appendTo(fgDiv);

                        var descriptionElement = $('<div></div>');
                        descriptionElement.addClass('p85-graph-point-description');
                        descriptionElement.html(point.descr);
                        descriptionElement.css({
                            top: point.y + 10,
                            left: point.x - 10
                        });
                        descriptionElement.appendTo(fgDiv);
                    }
                );
            }
        }

        function AgendaLayer(options){
            this.getCanvas = function(){
                var div = $('<div class="p85-graph-agenda"></div>');

                drawAgenda(div);

                return div;
            };

            function drawAgenda(div){

                for(var i = 0; i < options.types.length; i++){

                    var pointElement = $(template("rhomb-tmpl-div"));
                    pointElement.addClass('p85-graph-point-type' + i);

                    pointElement.appendTo(div);

                    var span = $('<span></span>');
                    span.html(' - ' + options.types[i].description);

                    span.appendTo(div);
                }
            }

        }

        //noinspection JSUnusedLocalSymbols
        function BackgroundLayer(options, params){

            this.getCanvas = function(){
                var canvas = createCanvas(bgClassName);
                var context = canvas.getContext('2d');

                drawBackground();

                drawCurve();

                drawAxes();

                function drawBackground(){
                    context.fillStyle = options['backgroundColor'];
                    context.fillRect(0, 0, options['width'], options['height']);
                }

                function drawAxes(){

                    context.strokeStyle = options['axesColor'];
                    context.lineWidth = 1;
                    context.font = '8pt ' + options['fontFamily'];
                    context.fillStyle = options['axesDescriptionColor'];

                    context.beginPath();

                    context.lineWidth = 1;
                    context.moveTo(params['x0'], options['marginY']);
                    context.lineTo(params['x0'], params['y0']);
                    context.lineTo(options['width'] - options['marginX'], params['y0']);
                    context.stroke();

                    context.closePath();

                    drawNotchesOnX();
                    drawNotchesOnY();

                    function drawNotchesOnX(){
                        var i, currentDate = 0;

                        drawFirstNotch();

                        if(coords.length > 1){

                            drawLastNotch();

                            for(i = 0; i < options['stepsX']; i++){
                                var x = params['x0'] + i * params['stepX'];

                                x = timeToX(
                                    getNearestPrettyDate(
                                        true,
                                        xToTime(x)
                                    )
                                );

                                context.beginPath();
                                context.moveTo(x, params['y0']);
                                context.lineTo(x, params['y0'] - options['height'] + options['marginY'] * 2);
                                context.stroke();
                                context.closePath();

                                var date = new Date();
                                date.setTime(xToTime(x));
                                context.fillText(date.format("%H:%M"), x, params['y0'] + 15);

                                if(i == 0 || currentDate != date.getDate()){
                                    context.fillText(date.format("%d %B %Y"), x, params['y0'] + 25);
                                }
                                currentDate = date.getDate();
                            }
                        }

                        function getNearestPrettyDate(direction, value){
                            var date = new Date();
                            date.setTime(value);
                            while(date.getMinutes() != 0 || (date.getHours() - 1) % (options['stepsX']) != 0){
                                if(direction){
                                    value += 60000;
                                }else{
                                    value -= 60000;
                                }
                                date.setTime(value);
                            }
                            return value;
                        }

                        function drawFirstNotch(){
                            var time = params['minX'];

                            var date = new Date();
                            date.setTime(time);
                            context.fillText(date.format("%H:%M"), timeToX(time) - 30, params['y0'] + 5);

                            if(coords.length == 1){
                                context.fillText(date.format("%d %B %Y"), params['x0'], params['y0'] + 25);
                            }
                        }

                        function drawLastNotch(){
                            var time = params['maxX'];

                            var date = new Date();
                            date.setTime(time);
                            context.fillText(date.format("%H:%M"), timeToX(time) + 5, params['y0'] + 5);
                        }
                    }

                    function drawNotchesOnY(){
                        for(var i = 0; i < options['stepsY']; i++){
                            var y = params['y0'] - i * params['stepY'];

                            context.beginPath();
                            context.moveTo(params['x0'], y);
                            context.lineTo(params['x0'] + options['width'] - options['marginX'] * 2, y);
                            context.stroke();
                            context.closePath();
                        }
                    }
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
            canvas.setAttribute('class', id);

            return canvas;
        }

        function mapPoints(callback){
            for(var i = 0; i < points.length; i++){
                if(callback(points[i]) === false){
                    break;
                }
            }
        }
        function mapInputArray(callback){
            //Type, Description, X, Y
            var params, timestamp;

            for(var i = 0; i < coords.length; i++){
                if(isArray(coords[i])){
                    params = arrayToObject(coords[i]);
                }else{
                    params = coords[i];

                    if(!params.hasOwnProperty('Type')){
                        throw "Wrong input format. Object should have the Type property";
                    }

                    if(!params.hasOwnProperty('Description')){
                        params.Description = '';
                    }

                    if(isNaN(parseFloat(params.Y))){
                        throw "Wrong input format. Y value can not be parsed as a float";
                    }
                }

                timestamp = Date.parse(params.X);

                if(isNaN(timestamp)){
                    throw "Wrong input format. Time can not be parsed";
                }

                callback(params.Type, params.Description, timestamp, params.Y);
            }

            function arrayToObject(array){

                if(array.length != 4){
                    throw "Wrong input format. Array should have 4 elements";
                }

                return {
                    Type: array[0],
                    Description: array[1],
                    X: array[2],
                    Y: array[3]
                }
            }

            function isArray(a){
                return Object.prototype.toString.call( a ) === '[object Array]';
            }
        }



        function getParams(){
            var maxX = 0,
                maxY = 0,
                minX = Number.MAX_VALUE,
                minY = Number.MAX_VALUE;

            mapInputArray(
                function(type, descr, x, y){
                    maxX = Math.max(x, maxX);
                    maxY = Math.max(y, maxY);
                    minX = Math.min(x, minX);
                    minY = Math.min(y, minY);
                }
            );

            var coefficientX, coefficientY, stepTime;

            if(coords.length > 1){
                coefficientX = (options['width'] - options['marginX'] * 2) / (maxX - minX);
                coefficientY = (options['height']/options['yK'] - options['marginY'] * 2) / (maxY - minY);
                stepTime = (maxX - minX) / options['stepsX'];
            }else{
                coefficientX = options['width'] - options['marginX'] * 2 / 100;
                coefficientY = (options['height']/options['yK'] - options['marginY'] * 2) / 100;
                stepTime = 100 / options['stepsX'];
            }

            return {
                coefficientX: coefficientX,
                coefficientY: coefficientY,
                x0: parseInt(options['marginX'], 10),
                y0: options['height'] - options['marginY'],
                minX: minX,
                maxX: maxX,
                minY: minY,
                stepTime: stepTime,
                stepX: stepTime * coefficientX,
                stepY: (options['height'] - options['marginY'] * 2) / options['stepsY']
            };
        }

        function getPoints(){

            var points = [];
            mapInputArray(
                function(type, descr, x, y){
                    points.push(
                        new Point(type, descr, x, y, options, params)
                    );
                }
            );
            return points;
        }

        function xToTime(x){
            return (x - params['x0']) / params['coefficientX'] + params['minX'];
        }

        function timeToX(time){
            return (time - params['minX'] + params['x0'] / params['coefficientX']) * params['coefficientX'];
        }

        function Style(options){
            this.getElement = function(){
                var style = document.createElement('style');
                var css = '.p85-graph-holder {font-family: ' + options['fontFamily'] + '}';

                for(var i = 0; i < options.types.length; i++){
                    var color = options.types[i].color;
                    css += '.p85-graph-point-type' + i + ' .rhomb-up { border-bottom-color: ' + color + '; } .p85-graph-point-type' + i + ' .rhomb-down { border-top-color: ' + color + '; }'
                }

                style.setAttribute('type', 'text/css');
                style.innerHTML = css;

                return style;
            }
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

    function StatusBar(){
        this.appendTo = function(container) {
            var statusBar = document.createElement('p');
            statusBar.setAttribute('class', statusBarClassName);
            container.append(statusBar);
        }
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
            fontFamily: 'Tahoma, serif',
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

    function template(id){
        switch(id){
            case 'rhomb-tmpl-div':
                return '<div class="p85-graph-point"><div class="rhomb-up"></div><div class="rhomb-down"></div></div>';
            case 'rhomb-tmpl-a':
                return '<a href="#" class="p85-graph-point"><div class="rhomb-up"></div><div class="rhomb-down"></div></a>';
            default:
                return '';
        }
    }
})( jQuery );