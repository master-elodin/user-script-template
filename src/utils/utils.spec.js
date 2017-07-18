describe("utils", function () {

    describe("createOnDelete", function () {

        it("should return a function that removes an item from an observable array", function () {
            var item1 = {id: "item1"};
            var item2 = {id: "item2"};
            var item3 = {id: "item3"};
            var observableArray = ko.observableArray([item1, item2, item3]);

            createOnDelete(observableArray)({owner: item2});

            expect(observableArray().length).toBe(2);
            expect(observableArray()[0]).toBe(item1);
            expect(observableArray()[1]).toBe(item3);
        });
    });

    describe("createToggle", function() {

        it("should toggle observable", function() {
            var item = ko.observable(false);

            var toggle = createToggle(item);

            toggle(item);

            expect(item()).toBe(true);

            toggle(item);

            expect(item()).toBe(false);
        });
    });

    describe("remove", function() {

        it("should remove an item if it's found in the array", function() {
            var array = [1, 2, 3];

            array.remove(2);

            expect(array.length).toBe(2);
            expect(array[0]).toBe(1);
            expect(array[1]).toBe(3);
        });

        it("should do nothing if item not found in the array", function() {
            var array = [1, 3];

            array.remove(4);

            expect(array.length).toBe(2);
            expect(array[0]).toBe(1);
            expect(array[1]).toBe(3);
        });
    });

    describe("removeWhitespace", function() {

        it("should remove whitespace", function() {
            expect(removeWhitespace("some string with spaces")).toBe("some-string-with-spaces");
        });
    });

    describe("pad", function() {

        it("should pad with given length and padChar", function() {
            expect(pad("4", 3, "0")).toBe("004");
        });
    });

    describe("formatTime", function() {

        it("should format for HH:mm", function() {
            expect(formatTime(new Date("2015-03-25T12:00:00"), "HH:mm")).toBe("12:00");
        });
    });
});