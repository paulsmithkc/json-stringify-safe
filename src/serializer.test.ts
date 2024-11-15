import { getSerialize } from './stringify';

function jsonify(obj: any): string {
  return JSON.stringify(obj, null, 2);
}

describe('serializer', function () {
  it('must stringify circular objects', function () {
    const obj: any = { a: 'b' };
    obj.circularRef = obj;
    obj.list = [obj, obj];

    expect(JSON.stringify(obj, getSerialize(), 2)).toEqual(
      jsonify({
        a: 'b',
        circularRef: '[Circular ~]',
        list: ['[Circular ~]', '[Circular ~]'],
      })
    );
  });
});
