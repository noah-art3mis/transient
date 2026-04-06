import {
  extractQid,
  parseYear,
  transformRawToWorkInserts,
  SparqlResponse,
} from "../../scripts/transform";

describe("extractQid", () => {
  it("extracts QID from Wikidata entity URI", () => {
    expect(extractQid("http://www.wikidata.org/entity/Q192")).toBe("Q192");
  });

  it("extracts QID from HTTPS URI", () => {
    expect(extractQid("https://www.wikidata.org/entity/Q12345")).toBe("Q12345");
  });
});

describe("parseYear", () => {
  it("parses year from xsd:dateTime string", () => {
    expect(parseYear("1600-01-01T00:00:00Z")).toBe(1600);
  });

  it("returns null for undefined", () => {
    expect(parseYear(undefined)).toBeNull();
  });

  it("parses negative years (BCE)", () => {
    expect(parseYear("-0472-01-01T00:00:00Z")).toBe(-472);
  });
});

describe("transformRawToWorkInserts", () => {
  it("groups multiple creators for the same work", () => {
    const raw: SparqlResponse = {
      results: {
        bindings: [
          {
            work: { type: "uri", value: "http://www.wikidata.org/entity/Q192" },
            workLabel: { type: "literal", value: "Hamlet" },
            workDescription: { type: "literal", value: "tragedy by Shakespeare" },
            creatorLabel: { type: "literal", value: "William Shakespeare" },
            creatorRoleLabel: { type: "literal", value: "playwright" },
            inception: { type: "literal", value: "1600-01-01T00:00:00Z" },
          },
          {
            work: { type: "uri", value: "http://www.wikidata.org/entity/Q192" },
            workLabel: { type: "literal", value: "Hamlet" },
            workDescription: { type: "literal", value: "tragedy by Shakespeare" },
            creatorLabel: { type: "literal", value: "Thomas Kyd" },
            creatorRoleLabel: { type: "literal", value: "playwright" },
            inception: { type: "literal", value: "1600-01-01T00:00:00Z" },
          },
        ],
      },
    };

    const result = transformRawToWorkInserts(raw, "theatre");

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Hamlet");
    expect(result[0].creators).toEqual([
      { name: "William Shakespeare", role: "playwright" },
      { name: "Thomas Kyd", role: "playwright" },
    ]);
    expect(result[0].media_type).toBe("theatre");
    expect(result[0].year_written).toBe(1600);
    expect(result[0].external_ids).toEqual({ wikidata_qid: "Q192" });
  });

  it("deduplicates same creator appearing multiple times", () => {
    const raw: SparqlResponse = {
      results: {
        bindings: [
          {
            work: { type: "uri", value: "http://www.wikidata.org/entity/Q192" },
            workLabel: { type: "literal", value: "Hamlet" },
            creatorLabel: { type: "literal", value: "William Shakespeare" },
            creatorRoleLabel: { type: "literal", value: "playwright" },
          },
          {
            work: { type: "uri", value: "http://www.wikidata.org/entity/Q192" },
            workLabel: { type: "literal", value: "Hamlet" },
            creatorLabel: { type: "literal", value: "William Shakespeare" },
            creatorRoleLabel: { type: "literal", value: "playwright" },
          },
        ],
      },
    };

    const result = transformRawToWorkInserts(raw, "theatre");

    expect(result).toHaveLength(1);
    expect(result[0].creators).toHaveLength(1);
  });

  it("handles works with no creator or optional fields", () => {
    const raw: SparqlResponse = {
      results: {
        bindings: [
          {
            work: { type: "uri", value: "http://www.wikidata.org/entity/Q555" },
            workLabel: { type: "literal", value: "Unknown Play" },
          },
        ],
      },
    };

    const result = transformRawToWorkInserts(raw, "theatre");

    expect(result).toHaveLength(1);
    expect(result[0].creators).toEqual([]);
    expect(result[0].year_written).toBeNull();
    expect(result[0].description).toBeNull();
  });
});
