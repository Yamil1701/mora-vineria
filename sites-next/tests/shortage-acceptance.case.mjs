import assert from 'node:assert/strict';
import {cartShortages,acceptShortages,shortagesAccepted} from '../dist/shortage-model.js';
const d={products:[{id:'p',stock:6}],cart:{p:7},shortageAccepted:{}};
assert.deepEqual(cartShortages(d),[{id:'p',qty:7,stock:6,missing:1}]);
assert.equal(shortagesAccepted(d),false);acceptShortages(d);assert.equal(shortagesAccepted(d),true);
d.cart.p=8;assert.equal(shortagesAccepted(d),false);acceptShortages(d);assert.equal(shortagesAccepted(d),true);
d.products[0].stock=5;assert.equal(shortagesAccepted(d),false);acceptShortages(d);assert.equal(shortagesAccepted(d),true);
d.cart.p=6;assert.equal(shortagesAccepted(d),false);d.cart.p=5;assert.equal(shortagesAccepted(d),true);
console.log('Explicit shortage acceptance is tied to quantity and recorded stock, invalidated by changed shortage and unnecessary for sufficient stock.');
