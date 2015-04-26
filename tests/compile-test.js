
if( this.fn !== undefined ) {
	var compile = fn('compile');
}

describe('compile test', function () {

		var data;

		beforeEach(function () {
			data = {
				foo: 'bar',
				crash: {
					test: 'dummy'
				},
				list: ['foo', 'bar', 'foobar']
			};
		});

		it("should replace value", function() {
			expect( compile('value: ${foo}')(data) ).toBe('value: bar');
    });

		it("should return if", function() {
			expect( compile('$if{ foo === "bar" }gogogo{:}whoops{/}')(data) ).toBe('gogogo');
    });

		it("should return otherwise", function() {
			expect( compile('$if{ foo !== "bar" }gogogo{:}whoops{/}')(data) ).toBe('whoops');
    });

		it("should return list", function() {
			expect( compile('$each{ item in list },${item}{/}')(data) ).toBe(',foo,bar,foobar');
    });

		it("should return list with index", function() {
			expect( compile('$each{ item in list }[${$index}:${item}]{/}')(data) ).toBe('[0:foo][1:bar][2:foobar]');
    });

		it("should return list with index", function() {
			expect( compile('$each{ item,key in list }[${key}:${item}]{/}')(data) ).toBe('[0:foo][1:bar][2:foobar]');
    });

		it("should add new command", function() {
			compile.cmd('double', function (scope, expression) {
				return Number(scope.$eval(expression))*2;
			});

			expect( compile('$double{4}')(data) ).toBe('8');
    });

});
