import { Star, X } from "lucide-react";

const ImageCard = ({
  image,
  index,
  onRemove,
}) => {
  return (
    <div
      className="
        relative
        w-45 h-45
        border
        rounded-md
        overflow-hidden
        group
      "
    >
      <img
        src={image.preview}
        alt=""
        className="w-full h-full object-cover"
      />

      {/* Primary badge */}
      {index === 0 && (
        <div className="absolute top-3 left-3 bg-blue-600 rounded-md p-1">
          <Star size={18} className="text-white fill-white" />
        </div>
      )}

      {/* Delete button */}
      <button
        onClick={() => onRemove(image.id)}
        className="
          absolute
          top-3
          right-3
          bg-black/60
          rounded-full
          p-1
          text-white
          opacity-0
          group-hover:opacity-100
          transition
        "
      >
        <X size={18} />
      </button>

      {/* Primary label */}
      {index === 0 && (
        <div className="absolute bottom-0 w-full bg-black/50 text-white text-center py-2 text-sm">
          Primary Photo
        </div>
      )}
    </div>
  );
};

export default ImageCard;
