/* eslint-disable @typescript-eslint/no-explicit-any */

export type EntryProcessor = (key: string, value: any) => any;

function stringify(
  obj: any,
  replacer?: EntryProcessor | null,
  space?: string | number | null,
  cycleReplacer?: EntryProcessor | null
): string {
  return JSON.stringify(
    obj,
    serializer(replacer, cycleReplacer),
    space ?? undefined
  );
}

function serializer(
  replacer?: EntryProcessor | null,
  cycleReplacer?: EntryProcessor | null
): EntryProcessor {
  const stack: unknown[] = [];
  const keys: string[] = [];

  if (!cycleReplacer) {
    cycleReplacer = (_key, value) =>
      stack[0] === value
        ? '[Circular ~]'
        : '[Circular ~.' + keys.slice(0, stack.indexOf(value)).join('.') + ']';
  }

  return function (key, value) {
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
    return !replacer ? value : replacer.call(this, key, value);
  };
}

export { stringify, stringify as default, serializer as getSerialize };
