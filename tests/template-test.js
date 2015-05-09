
describe('compile test', function () {

		var data,
				samplePartial = $template('sample', 'value: ${foo}'),
				i18n = {
					cancel: 'Cancel',
					accept: 'Accept'
				};

		$template.cmd('i18n', function (scope, expression) {
				return i18n[expression.trim()] || i18n[scope.$eval(expression)] || expression.trim();
			}, true);

		beforeEach(function () {
			data = {
				foo: 'bar',
				crash: {
					test: 'dummy'
				},
				list: ['foo', 'bar', 'foobar'],
				map: {
					hi: 'all',
					bye: 'nobody'
				},
				template: 'sample',
				label: {
					cancel: 'cancel'
				}
			};
		});

		it("should replace value", function() {
			expect( $template.compile('value: ${foo}')(data) ).toBe('value: bar');
    });

		it("should use sample partial", function() {
			expect( samplePartial(data) ).toBe('value: bar');
    });

		it("should include sample partial", function() {
			expect( $template.compile('$include{sample}')(data) ).toBe('value: bar');
    });

		it("should return if sample", function() {
			expect( $template.compile('$if{ foo === "bar" }$include{sample}{:}whoops{/}')(data) ).toBe('value: bar');
    });

		it("should return if sample as string", function() {
			expect( $template.compile('$if{ foo === "bar" }$include{\'sample\'}{:}whoops{/}')(data) ).toBe('value: bar');
    });

		it("should return if sample as string", function() {
			expect( $template.compile('$if{ foo === "bar" }$include{ template }{:}whoops{/}')(data) ).toBe('value: bar');
    });

		it("should return if", function() {
			expect( $template.compile('$if{ foo === "bar" }gogogo{:}whoops{/}')(data) ).toBe('gogogo');
    });

		it("should return otherwise", function() {
			expect( $template.compile('$if{ foo !== "bar" }gogogo{:}whoops{/}')(data) ).toBe('whoops');
    });

		it("should return otherwise (2)", function() {
			expect( $template.compile('$if{ foo !== "bar" }gogogo{:}{/}')(data) ).toBe('');
    });

		it("should return list", function() {
			expect( $template.compile('$each{ item in list },${item}{/}')(data) ).toBe(',foo,bar,foobar');
    });

		it("should return list with index", function() {
			expect( $template.compile('$each{ item in list }[${$index}:${item}]{/}')(data) ).toBe('[0:foo][1:bar][2:foobar]');
    });

		it("should return list with index", function() {
			expect( $template.compile('$each{ item,key in list }[${key}:${item}]{/}')(data) ).toBe('[0:foo][1:bar][2:foobar]');
    });

		it("should return list with inheritance", function() {
			expect( $template.compile('$each{ item in list }[${foo}:${item}]{/}')(data) ).toBe('[bar:foo][bar:bar][bar:foobar]');
    });

		it("should return map", function() {
			expect( $template.compile('$each{ item in map }[${$key}:${item}]{/}')(data) ).toBe('[hi:all][bye:nobody]');
    });

		it("should return map with key", function() {
			expect( $template.compile('$each{ item, key in map }[${key}:${item}]{/}')(data) ).toBe('[hi:all][bye:nobody]');
    });

		it("should return map with key and inheritance", function() {
			expect( $template.compile('$each{ item, key in map }[${foo}:${key}:${item}]{/}')(data) ).toBe('[bar:hi:all][bar:bye:nobody]');
    });

		it("should add new command", function() {
			$template.cmd('double', function (scope, expression) {
				return Number(scope.$eval(expression))*2;
			});

			expect( $template.compile('$double{4}')(data) ).toBe('8');
    });

		it("should use custom i18n command (helper)", function() {
			expect( $template.compile('$i18n{label.cancel}')(data) ).toBe('Cancel');
    });

		it("should use custom i18n command (helper) inside a condition", function() {
			expect( $template.compile('$if{ foo === "bar" }$i18n{cancel}{:}$i18n{accept}{/}, done!')(data) ).toBe('Cancel, done!');
    });

});
