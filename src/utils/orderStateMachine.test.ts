/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionOrder, validateOrderTransition } from './orderStateMachine';

test('Order lifecycle transitions follow documented path', () => {
  assert.equal(canTransitionOrder('CREATED', 'PAYMENT_PENDING'), true);
  assert.equal(canTransitionOrder('PAYMENT_PENDING', 'CONFIRMED'), true);
  assert.equal(canTransitionOrder('CONFIRMED', 'MERCHANT_ACCEPTED'), true);
  assert.equal(canTransitionOrder('MERCHANT_ACCEPTED', 'PREPARING'), true);
  assert.equal(canTransitionOrder('PREPARING', 'READY_FOR_PICKUP'), true);
  assert.equal(canTransitionOrder('READY_FOR_PICKUP', 'RIDER_ASSIGNED'), true);
  assert.equal(canTransitionOrder('RIDER_ASSIGNED', 'PICKED_UP'), true);
  assert.equal(canTransitionOrder('PICKED_UP', 'IN_TRANSIT'), true);
  assert.equal(canTransitionOrder('IN_TRANSIT', 'DELIVERED'), true);

  // Illegal transitions must be denied
  assert.equal(canTransitionOrder('CREATED', 'DELIVERED'), false);
  assert.equal(canTransitionOrder('PAYMENT_PENDING', 'IN_TRANSIT'), false);
  assert.equal(canTransitionOrder('DELIVERED', 'PREPARING'), false);

  assert.throws(() => {
    validateOrderTransition('CREATED', 'DELIVERED');
  }, /Invalid order transition/);
});
