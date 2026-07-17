import { Search } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from "react-router-dom";
import VehicleForm from '../components/vehicles/VehicleForm';
import axios from 'axios'
import toast from 'react-hot-toast';



// Fixed: Proper React component with capital letter and return statement
const VehicleCard = ({ vehicle }) => {
  const navigate = useNavigate();
  return (
    <div className='w-200 h-22 p-4 flex bg-white mb-2 hover:bg-gray-300/10
     rounded transition border border-gray-400/20 cursor-pointer'
      onClick={() => { navigate(`/update/${vehicle._id}`) }}>
      <div className='flex items-center'>
        <h1 className='text-xs font-bold w-30'>{vehicle.name}</h1>
        <h1 className='text-xs'>{vehicle.type}</h1>
      </div>
      <div>
        {/* Add your additional content here */}
      </div>
    </div>
  );
};

const Vehicles = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'my-vehicles';
  const [vehicles, setVehicles] = useState([]);

  const changeParam = (tab) => {
    setSearchParams({ tab });
  }

  const getAllVehicles = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_URL}/vehicle/my-vehicles`);
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

  return (
    <div>
      <div>
        {/* header */}
        <div className='border border-b border-gray-400/20'>
          <div className='flex justify-between p-4'>
            <h1 className='text-3xl font-bold text-black/90'>Vehicles</h1>
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
      <VehicleForm />
      {/* Conditionally render VehicleForm */}
      {/*showForm && (
        <VehicleForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            getAllVehicles(); // Refresh the list
          }}
        />
      )*/}
    </div>
  )
}

export default Vehicles;