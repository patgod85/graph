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

