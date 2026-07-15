const QuoteForm = ({ isFormOpen }) => {
  return (
    <div className="fixed inset-0 z-50">
      {/* Blur */}
      <div className="absolute inset-0 bg-gray-600/60"></div>

      {/* Panel */}
      <div
        className={`
          absolute right-0 top-0 h-full w-[600px]
          bg-white border shadow-xl
          transition-transform duration-300
          ${isFormOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        ...
      </div>
    </div>
  );
};

export default QuoteForm;