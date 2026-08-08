// src/utils/constants.js

export const STATUS_COLORS = {
    pending: 'bg-gray-100 text-gray-700',
    confirmed: 'bg-blue-100 text-blue-700',
    dispatched: 'bg-purple-100 text-purple-700',
    started: 'bg-indigo-100 text-indigo-700',
    en_route: 'bg-yellow-100 text-yellow-700',
    arrived: 'bg-yellow-100 text-yellow-700',
    on_board: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-red-100 text-red-700',
    billed: 'bg-gray-100 text-gray-700'
};

export const STATUS_LABELS = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    dispatched: 'Dispatched',
    started: 'Started',
    en_route: 'En Route',
    arrived: 'Arrived',
    on_board: 'On Board',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
    billed: 'Billed'
};

export const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
};

export const getStatusLabel = (status) => {
    return STATUS_LABELS[status] || status;
};