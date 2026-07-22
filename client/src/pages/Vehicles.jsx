import { Search } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import VehicleForm from '../components/vehicles/VehicleForm';
import VehicleUpdateForm from '../components/vehicles/VehicleUpdateForm';
import axios from 'axios'
import toast from 'react-hot-toast';

const VehicleCard = ({ vehicle }) => {
  const navigate = useNavigate();
  return (
    <div className='w-200 p-4 flex items-center bg-white mb-2 hover:bg-gray-50
     rounded transition border border-gray-400/20 cursor-pointer'
      onClick={() => { navigate(`update/${vehicle._id}`) }}>
      <div className='flex items-center gap-4 flex-1'>
        <div className='w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center'>
          <span className='text-xs font-bold'>{vehicle.name?.substring(0, 2).toUpperCase()}</span>
        </div>
        <div>
          <h1 className='text-sm font-bold'>{vehicle.name}</h1>
          <p className='text-xs text-gray-500'>{vehicle.type} • {vehicle.passengerCapacity} Seats</p>
        </div>
      </div>
    </div>
  );
};

const Vehicles = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'my-vehicles';
  const [vehicles, setVehicles] = useState([]);

  const isUpdateRoute = location.pathname.includes('/update/');

  const changeParam = (tab) => {
    setSearchParams({ tab });
  }

  const getAllVehicles = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_URL}/vehicle/my-vehicles`,
        {
          withCredentials: true,
        }
      );
      if (data.success) {
        setVehicles(data.vehicles);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error(error);
    }
  };

  useEffect(() => {
    if (!searchParams.get('tab')) {
      changeParam('my-vehicles');
    }
    getAllVehicles();
  }, []);

  const refreshVehicles = () => {
    getAllVehicles();
  };

  return (
    <div>
      <div>
        {/* header */}
        <div className='border border-b border-gray-400/20'>
          <div className='flex justify-between p-4'>
            <h1 className='text-2xl font-bold text-black/90'>Vehicles</h1>
            <div className="border border-gray-400 rounded flex items-center px-2 
                hover:border-black/70 
                focus-within:border-blue-500 
                focus-within:ring-1 
                focus-within:ring-blue-500">
              <Search className='w-5.5 h-6 text-blue-600' strokeWidth={1.5} />
              <input type="text"
                className='outline-none'
                placeholder="Search vehicles..."
              />
            </div>

            <div>
              <button className='rounded text-white bg-blue-600/95 text-md px-4 py-2'
                onClick={() => { navigate('create') }}>
                Create Vehicle
              </button>
            </div>
          </div>

          <div className='p-3 flex justify-evenly'>
            <button
              className={`text-xs font-medium ${currentTab === 'my-vehicles' ? 'text-blue-600' : 'text-gray-600'}`}
              onClick={() => changeParam("my-vehicles")}
            >
              MY VEHICLES
            </button>
            <button
              className={`text-xs font-medium ${currentTab === 'external-affiliates' ? 'text-blue-600' : 'text-gray-600'}`}
              onClick={() => changeParam("external-affiliates")}
            >
              EXTERNAL AFFILIATES
            </button>
          </div>
        </div>

        {/* record  with h-screen scrolling is added issue*/}
        <div className='bg-sky-50/50 h-screen w-full px-4 py-2 flex flex-col items-center'>
          {currentTab === 'my-vehicles' && (
            vehicles.length > 0 ? (
              vehicles.map((vehicle, index) => (
                <VehicleCard key={vehicle.id || index} vehicle={vehicle} />
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No vehicles found</div>
            )
          )}
          {currentTab === 'external-affiliates' && (
            <div className="p-4">External affiliates content here</div>
          )}
        </div>
      </div>
      
      <VehicleForm onVehicleCreated={refreshVehicles} />
      <VehicleUpdateForm onVehicleUpdated={refreshVehicles} />
    </div>
  )
}

export default Vehicles;