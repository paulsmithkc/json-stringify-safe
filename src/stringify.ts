/* eslint-disable @typescript-eslint/no-explicit-any */

export type EntryProcessor = (key: string, value: any) => any;

export interface BigIntEx extends BigInt {
  toJSON?(): any;
}

function stringify(
  obj: any,
  replacer?: EntryProcessor | string[] | null,
  space?: string | number | null,
  cycleReplacer?: EntryProcessor | null,
): string {
  return JSON.stringify(
    obj,
    serializer(replacer, cycleReplacer),
    space ?? undefined,
  );
}

function serializer(
  replacer?: EntryProcessor | string[] | null,
  cycleReplacer?: EntryProcessor | null,
): EntryProcessor {
  const stack: unknown[] = [];
  const keys: string[] = [];

  if (!cycleReplacer) {
    cycleReplacer = (_key, value) =>
      stack[0] === value
        ? "[Circular ~]"
        : "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]";
  }

  return function (key, value) {
    if (typeof value === "bigint") {
      value = value.toString();
    }

    if (stack.length > 0) {
      const thisPos = stack.indexOf(this);
      ~thisPos ? stack.splice(thisPos + 1) : stack.push(this);
      ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key);
      if (cycleReplacer && ~stack.indexOf(value)) {
        value = cycleReplacer.call(this, key, value);
      }
    } else {
      stack.push(value);
    }

    if (!replacer) {
      return value;
    } else if (typeof replacer === "function") {
      return replacer.call(this, key, value);
    } else if (Array.isArray(replacer)) {
      return !key || replacer.includes(key) ? value : undefined;
    } else {
      return value;
    }
  };
}

export { stringify, stringify as default, serializer as getSerialize };
