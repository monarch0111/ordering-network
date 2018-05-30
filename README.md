# Order Management App

## Purpose
> Ordering network will help customers and outlets to come together on a platform to interact through BlockChain to create, update and transfer order from one place to another.

## Model Description (model/ordering.cto)
1. Paticipants - Customer, Outlet
2. Assets - Order
3. Transactions - updateOrderStatus, transferOrder
4. Events - orderStatusUpdateEvent, `
5. orderStatus - placed, received, prepared, dispatched, delivered, settled, cancelled, transferred

#### Restrictions defined for orderStatusUpdate
 ```js
 // Read as from : [to]
 const allowedStateChanges = {
    "placed"        :       ["received", "cancelled", "transferred"],
    "received"      :       ["prepared", "cancelled", "transferred"],
    "prepared"      :       ["dispatched", "cancelled", "transferred"],
    "dispatched"    :       ["delivered", "cancelled"],
    "delivered"     :       ["settled", "cancelled"],
    "settled"       :       ["cancelled"],
    "cancelled"     :       [],
    "transferred"   :       ["received"]
}
```

## Understanding Events
Events are more of a callback that will be recieved by your client application notifying that some transaction has been initated (either the final transaction state can be successful or aborted). for e.g.

##### Inside your composer application
```js
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const businessNetworkConnection = new BusinessNetworkConnection();
businessNetworkConnection.on('event', (event) => {
	// Got an event from Chaincode (SmartContract)
});
```

##### Inside your business network (refer lib/script.js)
```js
// From Chaincode
let event = getFactory().newEvent('com.box8', 'orderStatusUpdateEvent');
event.order = tx.order;
event.previousState = oldStatus;
event.newState = tx.newStatus;
emit(event);
```

## ACL (Access Control, refer permissions.acl)
1. Customer can create an Order (asset) at a particular Outlet.
2. Customer can check details of their own order.
3. Outlet can update order status or transfer order to another outlet.
4. NetworkAdmin has all the permission.

## Flow of transactions

1. Create Participants e.g. Customers, Outlet.
2. Create Asset (Order) and assign a Customer and Outlet.
3. Outlet will submit `updateOrderStatus` transaction of the order and event `orderStatusUpdateEvent` will be invoked from Chaincode, which can in turn notify Customer who have placed the order (only after valid state change allowed).
4. Outlet can even transfer the order by submitting `transferOrder` transaction. Status of the order will change to `transferred`, after successful commit of transaction `orderTransferEvent` will be emitted.
5. Other outlet apps can listen to the `orderTransferEvent` and submit `updateOrderStatus` to transaction to update Order Status. (e.g. `transferred` to `received`).


## Debug Chaincode
You can debug the chaincode using `composer-playground`
> Use below snippet to install and start composer-playground
```sh 
npm install -g composer-playground
composer-playground
```

In web-browser connection, after installing your Business Network Archive use `debugger` statement inside transaction functions and open `Developer Console` to stop chaincode at any point. :tada: 

For Example,
```js
/**
 * Update Order Status.
 * @param {com.box8.updateOrderStatus} tx The sample transaction instance.
 * @transaction
 */
async function updateOrderStatus(tx) {
	// validate transaction parameters
    debugger;
    // update asset details
    // emit events
}
```

While your developer console is open, the chain code will halt at `debugger;` statement and you can check all available methods, scope variables defined for your transaction.
