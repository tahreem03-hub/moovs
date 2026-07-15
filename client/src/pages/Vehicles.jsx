import { Search } from 'lucide-react'
import React from 'react'
import { useNavigate, useSearchParams } from "react-router-dom";
import VehicleForm from '../components/vehicles/VehicleForm';

const Vehicles = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const changeParam = (tab) => {
    setSearchParams({ tab });
  }

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
              className='outline-none' />
          </div>

          <div>
            <button className='rounded text-white bg-blue-600/95 text-md px-4 py-2'
              onClick={() => {navigate('create')}}>
              Create Vehicle
            </button>
          </div>
        </div>

        <div className='p-3 flex justify-evenly'>
          <button className='text-xs font-medium text-gray-600'
            onClick={() => changeParam("my-vehicles")}

          >
            MY VEHICLES
          </button>
          <button className='text-xs font-medium text-gray-600'
            onClick={() => changeParam("external-affiliates")}
          >
            EXTERNAL AFFILIATES
          </button>
        </div>

      </div>


      {/* record */}
      <div>

      </div>

      

      </div>
      <VehicleForm/>

    </div>
  )
}

export default Vehicles
