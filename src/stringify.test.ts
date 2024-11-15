import { stringify } from "./stringify";

function jsonify(obj: any): string {
  return JSON.stringify(obj, null, 2);
}

function bangString(_key: string, value: unknown): unknown {
  return typeof value == "string" ? value + "!" : value;
}

interface BigIntEx extends BigInt {
  toJSON?(): any;
}

beforeEach(() => {
  delete (BigInt.prototype as BigIntEx).toJSON;
});

describe("stringify", function () {
  it("must use space parameter", function () {
    const obj: any = { name: "Alice" };
    obj.self = obj;

    const expected = { name: "Alice", self: "[Circular ~]" };

    expect(stringify(obj, null)).toEqual(JSON.stringify(expected));
    expect(stringify(obj, null, null)).toEqual(JSON.stringify(expected));
    expect(stringify(obj, null, 1)).toEqual(JSON.stringify(expected, null, 1));
    expect(stringify(obj, null, 2)).toEqual(JSON.stringify(expected, null, 2));
    expect(stringify(obj, null, "")).toEqual(
      JSON.stringify(expected, null, ""),
    );
    expect(stringify(obj, null, " ")).toEqual(
      JSON.stringify(expected, null, " "),
    );
    expect(stringify(obj, null, "  ")).toEqual(
      JSON.stringify(expected, null, "  "),
    );
    expect(stringify(obj, null, "\t")).toEqual(
      JSON.stringify(expected, null, "\t"),
    );
  });

  it("must stringify circular objects", function () {
    const obj: any = { name: "Alice" };
    obj.self = obj;

    expect(stringify(obj, null, 2)).toEqual(
      jsonify({ name: "Alice", self: "[Circular ~]" }),
    );
  });

  it("must stringify circular objects with intermediaries", function () {
    const obj: any = { name: "Alice" };
    obj.identity = { self: obj };

    expect(stringify(obj, null, 2)).toEqual(
      jsonify({ name: "Alice", identity: { self: "[Circular ~]" } }),
    );
  });

  it("must stringify circular objects deeper", function () {
    const obj: any = { name: "Alice", child: { name: "Bob" } };
    obj.child.self = obj.child;

    expect(stringify(obj, null, 2)).toEqual(
      jsonify({
        name: "Alice",
        child: { name: "Bob", self: "[Circular ~.child]" },
      }),
    );
  });

  it("must stringify circular objects deeper with intermediaries", function () {
    const obj: any = { name: "Alice", child: { name: "Bob" } };
    obj.child.identity = { self: obj.child };

    expect(stringify(obj, null, 2)).toEqual(
      jsonify({
        name: "Alice",
        child: { name: "Bob", identity: { self: "[Circular ~.child]" } },
      }),
    );
  });

  it("must stringify circular objects in an array", function () {
    const obj: any = { name: "Alice" };
    obj.self = [obj, obj];

    expect(stringify(obj, null, 2)).toEqual(
      jsonify({
        name: "Alice",
        self: ["[Circular ~]", "[Circular ~]"],
      }),
    );
  });

  it("must stringify circular objects deeper in an array", function () {
    const obj: any = {
      name: "Alice",
      children: [{ name: "Bob" }, { name: "Eve" }],
    };
    obj.children[0].self = obj.children[0];
    obj.children[1].self = obj.children[1];

    expect(stringify(obj, null, 2)).toEqual(
      jsonify({
        name: "Alice",
        children: [
          { name: "Bob", self: "[Circular ~.children.0]" },
          { name: "Eve", self: "[Circular ~.children.1]" },
        ],
      }),
    );
  });

  it("must stringify circular arrays", function () {
    const obj: any = [];
    obj.push(obj);
    obj.push(obj);

    expect(stringify(obj, null, 2)).toEqual(
      jsonify(["[Circular ~]", "[Circular ~]"]),
    );
  });

  it("must stringify circular arrays with intermediaries", function () {
    const obj: any = [];
    obj.push({ name: "Alice", self: obj });
    obj.push({ name: "Bob", self: obj });

    expect(stringify(obj, null, 2)).toEqual(
      jsonify([
        { name: "Alice", self: "[Circular ~]" },
        { name: "Bob", self: "[Circular ~]" },
      ]),
    );
  });

  it("must stringify repeated objects in objects", function () {
    const obj: any = {};
    const alice: any = { name: "Alice" };
    obj.alice1 = alice;
    obj.alice2 = alice;

    expect(stringify(obj, null, 2)).toEqual(
      jsonify({
        alice1: { name: "Alice" },
        alice2: { name: "Alice" },
      }),
    );
  });

  it("must stringify repeated objects in arrays", function () {
    const alice: any = { name: "Alice" };
    const obj: any = [alice, alice];

    expect(stringify(obj, null, 2)).toEqual(
      jsonify([{ name: "Alice" }, { name: "Alice" }]),
    );
  });

  it("must call given decycler and use its output", function () {
    const obj: any = {};
    obj.a = obj;
    obj.b = obj;

    const decycle = jest.fn();
    decycle.mockImplementation(() => decycle.mock.calls.length);

    expect(stringify(obj, null, 2, decycle)).toEqual(jsonify({ a: 1, b: 2 }));

    expect(decycle).toHaveBeenCalledTimes(2);
    expect(decycle).toHaveBeenNthCalledWith(1, "a", obj);
    expect(decycle).toHaveBeenNthCalledWith(2, "b", obj);
  });

  it("must call replacer and use its output", function () {
    const obj: any = { name: "Alice", child: { name: "Bob" } };

    const replacer = jest.fn(bangString);

    expect(stringify(obj, replacer, 2)).toEqual(
      jsonify({ name: "Alice!", child: { name: "Bob!" } }),
    );

    expect(replacer).toHaveBeenCalledTimes(4);
    expect(replacer).toHaveBeenNthCalledWith(1, "", obj);
    expect(replacer).toHaveBeenNthCalledWith(2, "name", "Alice");
    expect(replacer).toHaveBeenNthCalledWith(3, "child", obj.child);
    expect(replacer).toHaveBeenNthCalledWith(4, "name", "Bob");
  });

  it("must call replacer after describing circular references", function () {
    const obj: any = { name: "Alice" };
    obj.self = obj;

    const replacer = jest.fn(bangString);

    expect(stringify(obj, replacer, 2)).toEqual(
      jsonify({ name: "Alice!", self: "[Circular ~]!" }),
    );

    expect(replacer).toHaveBeenCalledTimes(3);
    expect(replacer).toHaveBeenNthCalledWith(1, "", obj);
    expect(replacer).toHaveBeenNthCalledWith(2, "name", "Alice");
    expect(replacer).toHaveBeenNthCalledWith(3, "self", "[Circular ~]");
  });

  it("must call given decycler and use its output for nested objects", function () {
    const obj: any = {};
    obj.a = obj;
    obj.b = { self: obj };

    const decycle = jest.fn();
    decycle.mockImplementation(() => decycle.mock.calls.length);

    expect(stringify(obj, null, 2, decycle)).toEqual(
      jsonify({ a: 1, b: { self: 2 } }),
    );

    expect(decycle).toHaveBeenCalledTimes(2);
    expect(decycle).toHaveBeenNthCalledWith(1, "a", obj);
    expect(decycle).toHaveBeenNthCalledWith(2, "self", obj);
  });

  it("must use decycler's output when it returned null", function () {
    const obj: any = { a: "b" };
    obj.self = obj;
    obj.selves = [obj, obj];

    function decycle() {
      return null;
    }

    expect(stringify(obj, null, 2, decycle)).toEqual(
      jsonify({
        a: "b",
        self: null,
        selves: [null, null],
      }),
    );
  });

  it("must use decycler's output when it returned undefined", function () {
    const obj: any = { a: "b" };
    obj.self = obj;
    obj.selves = [obj, obj];

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    function decycle() {}

    expect(stringify(obj, null, 2, decycle)).toEqual(
      jsonify({
        a: "b",
        selves: [null, null],
      }),
    );
  });

  it("must throw given a decycler that returns a cycle", function () {
    const obj: any = {};
    obj.self = obj;

    function identity(_key: string, value: unknown) {
      return value;
    }

    expect(() => stringify(obj, null, 2, identity)).toThrow(
      "Converting circular structure to JSON\n    --> starting at object with constructor 'Object'\n    --- property 'self' closes the circle",
    );
  });

  it("handle array replacer", function () {
    expect(JSON.stringify({ a: "b", c: "d" }, ["a"])).toEqual('{"a":"b"}');
    expect(
      JSON.stringify({ a: "b", c: { d: "e", f: "j" } }, ["a", "c.d"]),
    ).toEqual('{"a":"b"}');
    expect(stringify({ a: "b", c: "d" }, ["a"])).toEqual('{"a":"b"}');
    expect(stringify({ a: "b", c: { d: "e", f: "j" } }, ["a", "c.d"])).toEqual(
      '{"a":"b"}',
    );
  });

  it("handle object replacer", function () {
    expect(JSON.stringify({ a: "b", c: "d" }, { a: "a" } as any)).toEqual(
      '{"a":"b","c":"d"}',
    );
    expect(stringify({ a: "b", c: "d" }, { a: "a" } as any)).toEqual(
      '{"a":"b","c":"d"}',
    );
  });

  it("must stringify BigInts (w/ toString())", function () {
    const bigint = 1n;
    expect(() => JSON.stringify(bigint)).toThrow(
      "Do not know how to serialize a BigInt",
    );
    expect(stringify(bigint)).toEqual('"1"');
  });

  it("must stringify BigInts (w/ toJson())", function () {
    const bigint = 2n;
    (BigInt.prototype as BigIntEx).toJSON = function (this: BigInt) {
      return Number(this);
    };
    expect(JSON.stringify(bigint)).toEqual("2");
    expect(stringify(bigint)).toEqual("2");
  });

  it("must stringify circular objects with BigInts", function () {
    const obj: any = { n: 3n };
    obj.self = obj;

    expect(stringify(obj, null, 2)).toEqual(
      jsonify({
        n: "3",
        self: "[Circular ~]",
      }),
    );
  });
});
