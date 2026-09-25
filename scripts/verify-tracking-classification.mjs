import assert from 'node:assert/strict';
import { classifyNetworkFailure, classifyShipmentQuery } from '../src/services/trackingClassification.ts';

const found = classifyShipmentQuery({ id: 'shipment-id', tracking_number: '010101010101' }, null);
assert.equal(found.status, 'found');
assert.equal(found.status === 'found' && found.trackingNumber, '010101010101');
assert.equal(classifyShipmentQuery(null, null).status, 'not_found');
assert.equal(classifyNetworkFailure().status, 'network_error');
assert.equal(classifyShipmentQuery(null, { code: '500' }).status, 'server_error');
assert.equal(classifyShipmentQuery(null, { code: 'PGRST205' }).status, 'server_error');
assert.equal(classifyShipmentQuery(null, { code: 'PGRST202' }).status, 'server_error');
assert.equal(classifyShipmentQuery(null, { code: '42P01' }).status, 'server_error');

console.log('8 tracking classification checks passed.');
