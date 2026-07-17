import { ImagePlus, Star } from "lucide-react";

const UploadCard = ({ onUpload, length }) => {
  return (
    <label
      className="
        relative
        w-45 h-45
        border border-blue-100
        rounded
        bg-sky-200/10
        hover:bg-sky-200/20
        cursor-pointer
        flex flex-col
        items-center
        justify-center
        transition
      "
    >
      {/* Primary badge */}
      {length === 0 &&
      <div className="absolute top-2 left-2 bg-blue-600 rounded-md p-1">
        <Star size={18} className="text-white fill-blue-600" />
      </div>}

      <ImagePlus size={60} className="text-blue-400/50" strokeWidth={0.8} />

      <p className='text-sm text-blue-600/80 font-medium mt-3'>
        Add a vehicle photo
      </p>

      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onUpload}
      />
    </label>
  );
};

export default UploadCard;