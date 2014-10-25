describe("Plugin testing", function() {
    it("Plugin is available", function() {
        expect(typeof $('').graph).toBe('function');
    });

    it("Without params plugin will not throw an exception", function() {
        expect($('body').graph).not.toThrow();
    });

    it("Plugin has internals method 'appendTo'", function() {
        var Graph = $('body').graph({}, [], 'internals');

        var g = new Graph({}, [[0, '', '9 April 2014 21:14', 22000]]);

        expect(typeof g.appendTo).toBe('function');
    });
});

describe("Graph class testing", function() {

    it("Class has method 'getInternals'", function() {
        var Graph = $('body').graph({}, [], 'internals');

        var g = new Graph({}, [[0, '', '9 April 2014 21:14', 22000]]);

        expect(typeof g.getInternals).toBe('function');
    });

    function callX2X(coords){
        var Graph = $('body').graph({}, [], 'internals');

        var g = new Graph(
            {},
            coords
        );

        var methods = g.getInternals();

        var x, points = [10, 100, 200, 37];

        for(var i = 0; i < points.length; i++){
            x = points[i];
            expect(
                Math.round(
                    methods.timeToX(
                        methods.xToTime(
                            x
                        )
                    )
                )
            ).toBe(x);
        }
    }

    it("Methods xToTime and timeToX work correctly", function() {
        callX2X([
            [0, '', '9 April 2014 21:14', 22000],
            [1, '1', '10 April 2014 07:00', 21000],
            [1, '2', '10 April 2014 12:00', 19800]
        ]);
    });

    it("Methods xToTime and timeToX work correctly for only one coordinate", function() {

        callX2X([
            [1, '2', '10 April 2014 12:00', 19800]
        ]);

    });
});