const createDynamicRequest = (pickup, hub) => {
    return {
        pickup: {
            id: pickup.id,
            length: pickup.length,
            breadth: pickup.breadth,
            height: pickup.height,
            is_delivery: pickup.is_delivery,
            location: {x: pickup.location.x, y: pickup.location.y},
        },
        // object_ids: data.object_ids,
        // paths: data.paths,
        hub: {x: hub.x, y: hub.y},
    };
};

export default createDynamicRequest;
