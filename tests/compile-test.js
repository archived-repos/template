
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
				list: ['foo', 'bar', 'foobar']
			};
		});

		it("should replace value", function() {
			expect( compile('value: ${foo}')(scope) ).toBe('value: bar');
    });

		it("should return if", function() {
			expect( compile('$if{ foo === "bar" }gogogo{:}whoops{/}')(scope) ).toBe('gogogo');
    });

		it("should return otherwise", function() {
			expect( compile('$if{ foo !== "bar" }gogogo{:}whoops{/}')(scope) ).toBe('whoops');
    });

		it("should return list", function() {
			expect( compile('$each{ item in list },${item}{/}')(scope) ).toBe(',foo,bar,foobar');
    });

		it("should return list with index", function() {
			expect( compile('$each{ item in list }[${$index}:${item}]{/}')(scope) ).toBe('[0:foo][1:bar][2:foobar]');
    });

		it("should return list with index", function() {
			expect( compile('$each{ item,key in list }[${key}:${item}]{/}')(scope) ).toBe('[0:foo][1:bar][2:foobar]');
    });

});
