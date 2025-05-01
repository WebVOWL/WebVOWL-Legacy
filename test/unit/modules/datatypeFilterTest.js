const OwlClass = require("../../../src/webvowl/js/elements/nodes/implementations/OwlClass");
const RdfsDatatype = require("../../../src/webvowl/js/elements/nodes/implementations/RdfsDatatype");
const DatatypeProperty = require("../../../src/webvowl/js/elements/properties/implementations/OwlDatatypeProperty");

describe("Collapsing of datatypes", function () {
	const filter;

	beforeEach(function () {
		jasmine.addMatchers({
			toBeInstanceOf: function () {
				return {
					compare: function (actual, expected) {
						return {
							pass: actual instanceof expected
						};
					}
				};
			}
		});
	});

	beforeEach(function () {
		filter = require("../../../src/webvowl/js/modules/datatypeFilter")();
		filter.enabled = true;
	});


	it("should remove datatypes with their properties", function () {
		const domain = new OwlClass(),
			datatypeProperty = new DatatypeProperty(),
			datatypeClass = new RdfsDatatype();

		datatypeProperty.domain = domain
		datatypeProperty.range = datatypeClass;

		filter.filter([domain, datatypeClass], [datatypeProperty]);

		expect(filter.filteredNodes().length).toBe(1);
		expect(filter.filteredNodes()[0]).toBeInstanceOf(OwlClass);
		expect(filter.filteredProperties().length).toBe(0);
	});

});
