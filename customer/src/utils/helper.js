export const getAddressString = (stop) => {
    if (!stop) return 'N/A';
    if (!stop.address) return 'N/A';
    
    if (typeof stop.address === 'object') {
        if (stop.address.formatted) return stop.address.formatted;
        if (stop.address.street) return stop.address.street;
    }
    
    if (typeof stop.address === 'string') {
        return stop.address;
    }
    
    return 'N/A';
};