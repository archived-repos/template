
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
			}
		};
	});

	it("should replace value", function() {
		expect( compile('value: ${foo}')(scope) ).toBe('value: bar');
    });

});
