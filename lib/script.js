/**
 * Update Order Status.
 * @param {com.box8.updateOrderStatus} tx The sample transaction instance.
 * @transaction
 */
async function updateOrderStatus(tx) {
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

    // Save the old value of the asset.
    const oldStatus = tx.order.status;
    const newStatus = tx.newStatus;

    // Validate state change parameter
    if(!allowedStateChanges[oldStatus].includes(newStatus)){
        let message = `Status change from ${oldStatus} to ${newStatus} not allowed.`;
        if(allowedStateChanges[oldStatus].length > 0){
            message += ` Allowed state changes: ${allowedStateChanges[oldStatus].join(", ")}`;
        }
        throw new Error (message);
    }

    // Update the asset with the new value.
    tx.order.status = newStatus;
    
    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry('com.box8.Order');
    // Update the asset in the asset registry.
    await assetRegistry.update(tx.order);

    // Emit an event for the modified asset.
    let event = getFactory().newEvent('com.box8', 'orderStatusUpdateEvent');
    event.order = tx.order;
    event.previousState = oldStatus;
    event.newState = tx.newStatus;
    emit(event);
}

/**
 * Transfer order from one outlet to another.
 * @param {com.box8.transferOrder} tx The sample transaction instance.
 * @transaction
 */
async function transferOrder(tx) {

    const oldOutlet = tx.order.outlet;
    const newOutlet = tx.newOutlet;

    const participantRegistry = await getParticipantRegistry('com.box8.Outlet');
    const isNewOwnerRegistered = await participantRegistry.exists(newOutlet.outletId);
    
    if(!isNewOwnerRegistered){
        throw new Error ("Can't find new outlet registered. Please register the owner first.");
    }

    if (oldOutlet.outletId === newOutlet.outletId){
        throw new Error("Can't transfer to the same outlet.")
    }
    // Change order status to transferred
    tx.order.status = "transferred";

    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry('com.box8.Order');
    // Update the asset in the asset registry.
    await assetRegistry.update(tx.order);

    // Emit an event for the modified asset.
    let event = getFactory().newEvent('com.box8', 'orderTransferEvent');
    event.order = tx.order;
    event.previousOutlet = oldOutlet;
    event.newOutlet = newOutlet;
    emit(event);
}