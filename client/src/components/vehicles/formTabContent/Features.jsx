import React from "react";
import { Minus, Plus, Info } from "lucide-react";

const GENERAL_FEATURES = [
  "AC",
  "Bathroom",
  "Dance Pole",
  "In-Vehicle Bar",
  "Luggage",
  "Refrigerator",
  "Tables",
  "Trash Can",
  "Wheelchair Accessible",
  "Ice Chest",
];

const MULTIMEDIA_FEATURES = [
  "AUX",
  "Bluetooth",
  "DVD Player",
  "Game Console",
  "Karaoke",
  "TV",
  "USB",
  "Wifi",
  "Power Outlets",
];

const POLICIES = ["Alcohol Friendly", "Food Allowed", "Pets Allowed", "Smoking Allowed"];

const CHILD_SEAT_TYPES = {
  REAR_FACING: 'rearFacing',
  FORWARD_FACING: 'forwardFacing',
  BOOSTER: 'booster',
};

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 py-2 cursor-pointer select-none">
      <span
        onClick={onChange}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
            <path
              d="M3 8.5L6.5 12L13 4.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="text-[15px] text-gray-800">{label}</span>
    </label>
  );
}

function twoColumns(items) {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

function CheckboxGrid({ items, checkedSet, onToggle }) {
  const [left, right] = twoColumns(items);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12">
      <div>
        {left.map((label) => (
          <Checkbox
            key={label}
            label={label}
            checked={checkedSet.has(label)}
            onChange={() => onToggle(label)}
          />
        ))}
      </div>
      <div>
        {right.map((label) => (
          <Checkbox
            key={label}
            label={label}
            checked={checkedSet.has(label)}
            onChange={() => onToggle(label)}
          />
        ))}
      </div>
    </div>
  );
}

function ChildSeatCard({ 
  title, 
  imageQuery, 
  seatData, 
  onSeatChange 
}) {
  const handleToggleEnabled = () => {
    onSeatChange({
      ...seatData,
      enabled: !seatData.enabled
    });
  };

  const handleQuantityChange = (newQuantity) => {
    onSeatChange({
      ...seatData,
      quantity: Math.max(1, newQuantity)
    });
  };

  const handleAmountChange = (amount) => {
    const numericAmount = parseFloat(amount) || 0;
    onSeatChange({
      ...seatData,
      amount: numericAmount
    });
  };

  const handleDescriptionChange = (description) => {
    onSeatChange({
      ...seatData,
      description
    });
  };

  return (
    <div className={seatData.enabled ? "" : "opacity-100"}>
      <label className="flex items-center gap-3 py-1 cursor-pointer select-none mb-4">
        <span
          onClick={handleToggleEnabled}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
            seatData.enabled ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"
          }`}
        >
          {seatData.enabled && (
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
              <path
                d="M3 8.5L6.5 12L13 4.5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span className="text-[17px] text-gray-800">{title}</span>
      </label>

      <div className="flex gap-6 flex-col sm:flex-row">
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1.5">Quantity</div>
              <div className="flex items-center justify-between rounded-lg border border-gray-300 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(seatData.quantity - 1)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  disabled={seatData.quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="text-[15px] text-gray-800">{seatData.quantity}</span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(seatData.quantity + 1)}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1.5">Amount</div>
              <div className="rounded-lg border border-gray-300 px-3 py-2.5">
                <input
                  type="text"
                  value={seatData.amount || ''}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full outline-none text-[15px] text-gray-800"
                  placeholder="$ 0.00"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-300 px-3 py-2.5">
            <input
              type="text"
              value={seatData.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Short Description"
              className="w-full outline-none text-[15px] text-gray-500 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="w-full sm:w-40 h-32 sm:h-auto rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={imageQuery}
            alt={title}
            className="w-full h-full object-contain p-2"
          />
        </div>
      </div>
    </div>
  );
}

export default function Features({ formData, setFormData }) {
  // Helper function to update form data
  const updateFormData = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };
  

  // Feature toggles
  const toggleFeature = (label) => {
    const currentFeatures = formData.features.general || [];
    const allFeatures = [...GENERAL_FEATURES, ...MULTIMEDIA_FEATURES];
    
    // Determine which category the feature belongs to
    if (GENERAL_FEATURES.includes(label)) {
      const updated = currentFeatures.includes(label)
        ? currentFeatures.filter(f => f !== label)
        : [...currentFeatures, label];
      updateFormData('features.general', updated);
    } else if (MULTIMEDIA_FEATURES.includes(label)) {
      const currentMultimedia = formData.features.multiMedia || [];
      const updated = currentMultimedia.includes(label)
        ? currentMultimedia.filter(f => f !== label)
        : [...currentMultimedia, label];
      updateFormData('features.multiMedia', updated);
    }
  };

  const togglePolicy = (label) => {
    const currentPolicies = formData.features.policies || [];
    const updated = currentPolicies.includes(label)
      ? currentPolicies.filter(p => p !== label)
      : [...currentPolicies, label];
    updateFormData('features.policies', updated);
  };

  // Child seat updates
  const updateChildSeat = (seatType, seatData) => {
    updateFormData(`features.childSeats.${seatType}`, seatData);
  };

  // Get checked sets for display
  const getCheckedSet = (featureList) => {
    const currentFeatures = featureList === 'general' 
      ? formData.features.general || []
      : formData.features.multiMedia || [];
    
    return new Set(currentFeatures);
  };

  const getPoliciesSet = () => {
    return new Set(formData.features.policies || []);
  };

  // Helper to check if a feature is checked
  const isFeatureChecked = (label) => {
    const allChecked = [
      ...(formData.features.general || []),
      ...(formData.features.multiMedia || [])
    ];
    return allChecked.includes(label);
  };

  // Create checked sets for display
  const generalChecked = new Set(formData.features.general || []);
  const multimediaChecked = new Set(formData.features.multiMedia || []);
  const policiesChecked = new Set(formData.features.policies || []);

  return (
    <div className="min-h-screen">
      <div className="max-w-3x">
        <div className="">
          <h1 className="text-[18px] font-bold text-black/90 mb-8">Vehicle Features</h1>

          <div className="mb-4 text-xs font-medium tracking-wide text-gray-400">GENERAL</div>
          <CheckboxGrid 
            items={GENERAL_FEATURES} 
            checkedSet={generalChecked} 
            onToggle={toggleFeature} 
          />

          <div className="mt-8 mb-4 text-xs font-medium tracking-wide text-gray-400">MULTIMEDIA</div>
          <CheckboxGrid 
            items={MULTIMEDIA_FEATURES} 
            checkedSet={multimediaChecked} 
            onToggle={toggleFeature} 
          />

          <div className="mt-10 mb-4 text-xs font-medium tracking-wide text-gray-400">POLICIES</div>
          <CheckboxGrid 
            items={POLICIES} 
            checkedSet={policiesChecked} 
            onToggle={togglePolicy} 
          />

          <div className="mt-10 mb-6 flex items-center gap-2 text-xs font-medium tracking-wide text-gray-400">
            CHILD SEATS
            <Info size={14} className="text-gray-400" />
          </div>

          <div className="space-y-8">
            <ChildSeatCard
              title="Rear-facing seat"
              imageQuery="https://firebasestorage.googleapis.com/v0/b/dooms-prod.appspot.com/o/child_seat_images%2Frear-facing.png?alt=media&token=27b5272c-864e-46cb-9326-a689d52f7628"
              seatData={formData.features.childSeats.rearFacing}
              onSeatChange={(data) => updateChildSeat(CHILD_SEAT_TYPES.REAR_FACING, data)}
            />

            <hr className="border-gray-100" />

            <ChildSeatCard
              title="Forward-facing seat"
              imageQuery="https://firebasestorage.googleapis.com/v0/b/dooms-prod.appspot.com/o/child_seat_images%2Fforward-facing.png?alt=media&token=f9126402-57f5-406d-8aa6-2bec5ecc15ff"
              seatData={formData.features.childSeats.forwardFacing}
              onSeatChange={(data) => updateChildSeat(CHILD_SEAT_TYPES.FORWARD_FACING, data)}
            />

            <hr className="border-gray-100" />

            <ChildSeatCard
              title="Booster seat"
              imageQuery="https://firebasestorage.googleapis.com/v0/b/dooms-prod.appspot.com/o/child_seat_images%2Fbooster.png?alt=media&token=7d78ab1f-5d21-4a39-b816-4fe7dd3c34ba"
              seatData={formData.features.childSeats.booster}
              onSeatChange={(data) => updateChildSeat(CHILD_SEAT_TYPES.BOOSTER, data)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}