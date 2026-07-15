


import React, { useEffect, useState } from 'react'

import { useNavigate, useSearchParams } from "react-router-dom";

const ReservationsDashboard = () => {

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();


    const changeStatus = (status) => {
        setSearchParams({ status });
    };


    // this will automatically open status all page on component load
    {
        useEffect(() => {
            if (!searchParams.get("status")) {
                setSearchParams({ status: "ALL" }, { replace: true });
            }
        }, []);
    }

    return (
        <div className='min-h-screen w-80 border-r border-gray-400/20 '>
            {/* title */}

            <div className='p-3 border-b border-gray-300 pb-4'>

                <div className='flex justify-between pb-3'>
                    <h1 className='text-2xl font-bold text-black/90'>Reservations</h1>
                    <button className='rounded text-white bg-blue-600/95 text-lg w-20 h-9'
                        onClick={() => navigate({
                            pathname: "/reservations/create",
                            search: `?${searchParams.toString()}`
                        })}>
                    Create
                </button>
            </div>
            {/* day */}
            <div></div>

            {/* filter tabs */}
            <div>
                <button className='text-gray-700 transition py-1 px-2 rounded text-[11px] font-medium mx-1 hover:bg-sky-50' onClick={() => changeStatus("NEW")}>NEW</button>
                <button className='text-gray-700 transition py-1 px-2 rounded text-[11px] font-medium mx-1 hover:bg-sky-50' onClick={() => changeStatus("SENT")}>SENT</button>
                <button className='text-gray-700 transition py-1 px-2 rounded text-[11px] font-medium mx-1 hover:bg-sky-50' onClick={() => changeStatus("DRAFT")}>DRAFT</button>
                <button className='text-gray-700 transition py-1 px-2 rounded text-[11px] font-medium mx-1 hover:bg-sky-50' onClick={() => changeStatus("ARCHIVED")}>ARCHIVED</button>
                <button className='text-gray-700 transition py-1 px-2 rounded text-[11px] font-medium mx-1 hover:bg-sky-50' onClick={() => changeStatus("ALL")}>ALL</button>
            </div>

        </div>

            {/* records */ }

    <div>

    </div>

        </div >
    )
}

export default ReservationsDashboard
