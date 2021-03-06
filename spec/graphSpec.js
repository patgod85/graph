describe("Graph class testing", function() {

    var coordsSet = [
        [
            [0, '', '9 April 2014 21:14', 22000],
            [1, '1', '10 April 2014 07:00', 21000],
            [1, '2', '10 April 2014 12:00', 19800],
            {Type: 1, Description: '1', X: '10 April 2014 13:00', Y: 19700},
            [0, '', '10 April 2014 17:00', 19500],
            [1, '2', '11 April 2014 00:26', 19000],
            [1, '1', '12 April 2014 03:54', 18000]
        ],
        [
            [0, '', '9 April 2014 21:14', 22000],
            [1, '1', '10 April 2014 07:00', 20000],
            [1, '2', '10 April 2014 12:00', 19800]
        ],
        [
            [1, '2', '10 April 2014 12:00', 19800]
        ],
        [
            {
                "Type": 0,
                "Description": 1,
                "X": "2014-10-09T07:01:11.967",
                "Y": 1000.0000
            },
            {
                "Type": 0,
                "Description": 2,
                "X": "2014-10-09T07:52:49.937",
                "Y": 1200.0000
            },
            {
                "Type": 1,
                "Description": 3,
                "X": "2014-10-09T07:53:11.603",
                "Y": 1000.0000
            },
            {
                "Type": 0,
                "Description": 4,
                "X": "2014-10-09T07:56:08.387",
                "Y": 6000.0000
            }
        ]
    ];

    it("Class has method 'getInternals'", function() {
        var Graph = $('body').graph({}, [], 'internals');

        var g = new Graph({}, [[0, '', '9 April 2014 21:14', 22000]]);

        expect(typeof g.getInternals).toBe('function');
    });

    function getInternals(coords){
        var Graph = $('body').graph({}, [], 'internals');

        var g = new Graph(
            {},
            coords
        );

        return g.getInternals();
    }

    function callX2X(coords){

        var internals = getInternals(coords);

        var x, points = [10, 100, 200, 37];

        for(var i = 0; i < points.length; i++){
            x = points[i];
            expect(
                Math.round(
                    internals.timeToX(
                        internals.xToTime(
                            x
                        )
                    )
                )
            ).toBe(x);
        }
    }

    function checkParams(coords){
        var internals = getInternals(coords);

        for(var i in internals.params){
            if(internals.params.hasOwnProperty(i)){
                expect(isNaN(internals.params[i])).toBe(false);
            }
        }
    }

    function checkPoints(coords){
        var internals = getInternals(coords),
            xNotches = internals.xNotches,
            options = internals.options;

        if(coords.length == 1){
            expect(true).toBe(true);
            return;
        }else{
            expect(xNotches.length).toBe(options['stepsX']);
        }

        var x = 0;
        var cuts = [];

        for(var i = 0; i < xNotches.length; i++){
            cuts.push(Math.round(xNotches[i] - x));
            x = xNotches[i];
        }

        cuts.shift();

        var maxAllowableCut = (options['width'] - options['marginX'] * 2) / options['stepsX'];

        //console.log(JSON.stringify(cuts));
        expect(Math.max.apply({}, cuts) - Math.min.apply({}, cuts)).toBeLessThan(maxAllowableCut);
    }

    its("Methods xToTime and timeToX work correctly", callX2X);

    its("All params are calculated", checkParams);

    its("Points are spread normally", checkPoints);

    function its(title, testCallback){
        for(var i = 0; i < coordsSet.length; i++){
            callTestCallback(title, testCallback, i, coordsSet[i]);
        }

        function callTestCallback(title, callback, setNumber, coords){
            it(title + '. Set['+setNumber+']', function(){
                callback(coords);
            });
        }
    }
});