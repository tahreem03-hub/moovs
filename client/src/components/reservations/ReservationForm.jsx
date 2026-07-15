import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ReservationForm = ({ isFormOpen }) => {
    const navigate = useNavigate();

    return (
        <div
            className={`
                fixed inset-0 z-50
                transition-opacity duration-300
                ${isFormOpen ? "opacity-100 visible" : "opacity-0 invisible"}
            `}
        >
            {/* Background */}
            <div className="absolute inset-0 bg-gray-600/60"></div>

            {/* Panel */}
            <div
                className={`
                    absolute right-0 top-0 h-full w-[600px]
                    bg-white border shadow-xl
                    transform transition-transform duration-300 ease-in-out
                    ${isFormOpen ? "translate-x-0" : "translate-x-full"}
                `}
            >
                <button onClick={() => navigate('/reservations?status=ALL')}>
                    <X />
                </button>
            </div>
        </div>
    );
};

export default ReservationForm;