
if( this.fn !== undefined ) {
	var compile = fn('compile');
}

describe('compile test', function () {

		var scope;

		beforeEach(function () {
			scope = {
				foo: 'bar',
				crash: {
					test: 'dummy'
				},
				list: [1, 2, 3]
			};
		});

		it("should replace value", function() {
			expect( compile('value: ${foo}')(scope) ).toBe('value: bar');
    });

		it("should replace value", function() {
			expect( compile('$if{ foo === "bar" }gogogo{:}whoops{/}')(scope) ).toBe('gogogo');
    });

		it("should replace value", function() {
			expect( compile('$each{ item in list },${item}{/}')(scope) ).toBe(',1,2,3');
    });

});
