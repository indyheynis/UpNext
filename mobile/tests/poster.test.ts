import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newPoster, validateDetails, canExport, sizes } from '../src/domain/poster';
const valid = () => ({ ...newPoster(), name: 'Jordan Davis', team: 'Northside', number: '00' });
test('requires player identity and valid jersey numbers', () => {
  assert.match(validateDetails(newPoster())!, /name/);
  assert.equal(validateDetails(valid()), null);
  assert.match(validateDetails({ ...valid(), number: '100' })!, /0 to 99/);
  assert.match(validateDetails({ ...valid(), number: '-1' })!, /0 to 99/);
  assert.match(validateDetails({ ...valid(), team: ' ' })!, /team/);
});
test('rejects invalid dates, times and colors before rendering', () => {
  for (const date of ['tomorrow', '2026-02-30', '2026-13-01'])
    assert.ok(validateDetails({ ...valid(), date }));
  assert.equal(validateDetails({ ...valid(), date: '2028-02-29', time: '23:59' }), null);
  assert.ok(validateDetails({ ...valid(), time: '24:00' }));
  assert.ok(validateDetails({ ...valid(), primary: 'red' }));
});
test('first poster is free and repeat export stays available', () => {
  assert.equal(canExport('one', null), true);
  assert.equal(canExport('one', 'one'), true);
  assert.equal(canExport('two', 'one'), false);
});
test('export dimensions match Instagram formats', () => {
  assert.deepEqual(sizes.story, { width: 1080, height: 1920 });
  assert.deepEqual(sizes.post, { width: 1080, height: 1350 });
});
