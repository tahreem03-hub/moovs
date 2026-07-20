import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Plus, X, Lock, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const inputCls = `border rounded w-full px-4 py-2.5 border-gray-400/50 outline-none
  placeholder:text-gray-400 hover:border-black
  focus:ring-2 focus:ring-blue-600/90 focus:border-transparent
  transition-all duration-200 text-sm`;

const BASE_RATE = 100; // demo base rate used only for the preview

const SectionTitle = ({ children }) => (
  <h2 className="text-sm font-bold tracking-wide text-black/90 uppercase mb-4">
    {children}
  </h2>
);

const FieldLabel = ({ children }) => (
  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
    {children}
  </p>
);

const Toggle = ({ enabled, onChange, label, description, pro }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100">
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {pro && (
          <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            <Lock className="w-3 h-3" />
            Pro
          </span>
        )}
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

// Safe numeric parse: amounts are kept as strings in state so users can
// clear the field or type partial values ("." / "0.") without the input
// snapping back to 0. Parse only when calculating or saving.
const toNumber = (value) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

const DEFAULT_AVAILABLE_ITEMS = [
  { name: 'Gratuity', type: 'percentage' },
  { name: 'Tax', type: 'percentage' },
  { name: 'Discount', type: 'percentage' },
  { name: 'Tolls', type: 'flat' },
  { name: 'Meet & Greet', type: 'flat' },
  { name: 'Standard Transportation Costs', type: 'flat' },
  { name: 'Credit Card Service Fee', type: 'percentage' },
  { name: 'Other', type: 'flat' },
  { name: 'Other 2', type: 'flat' },
  { name: 'Other 3', type: 'flat' },
  { name: 'Other 4', type: 'flat' },
  { name: 'Other 5', type: 'flat' },
  { name: 'Other 6', type: 'flat' }
];

const DEFAULT_SETTINGS = {
  pricingLayout: {
    selectedItems: [], // [{ name, type, amount (string in state) }] — array order IS the display order
    pricePerStop: '0',
    enableAmountDueOnDriverApp: false,
    enableLuggageOptions: false,
    showTripStartEndTimes: false
  },
  timeFormat: '12h',
  dateFormat: 'MM/DD/YYYY',
  orderTypes: {
    requirement: 'optional',
    selected: [
      'Airport', 'Airport Drop Off', 'Airport Pick Up',
      'Anniversary', 'Bar/Bat Mitzvah', 'Birthday', 'Family Reunion', 'Funeral',
      'Kids Birthday', 'Quinceanera', 'Sweet 16',
      'Business Trip', 'Corporate', 'Corporate Event', 'Personal Trip',
      'Holiday', 'Medical', 'Other', 'Point-to-Point', 'Rental', 'Seaport',
      'Special Occasion', 'Train Station',
      'Field Trip', 'Graduation', 'Prom/Homecoming', 'School', 'School Fundraiser',
      'Bar', 'Baseball', 'Basketball', 'Brew Tour', 'Concert', 'Day Tour',
      'Football', 'Golf', 'Group Tour', 'Hockey', 'Leisure', 'Night Out',
      'Sporting Event', 'Wine Tour',
      'Bachelor/Bachelorette', 'Bridal Party', 'Bride/Groom', 'Wedding'
    ]
  }
};

// Normalize whatever the API returns into clean local state.
// selectedItems is the single source of truth; "enabled" flags for the
// dropdown are derived from it, so server/local state can never desync.
const normalizeFetchedSettings = (fetched) => {
  const merged = {
    ...DEFAULT_SETTINGS,
    ...fetched,
    pricingLayout: {
      ...DEFAULT_SETTINGS.pricingLayout,
      ...(fetched?.pricingLayout || {})
    },
    orderTypes: {
      ...DEFAULT_SETTINGS.orderTypes,
      ...(fetched?.orderTypes || {})
    }
  };

  // Coerce numeric fields (API may return numbers, strings, or null) to strings
  merged.pricingLayout.pricePerStop = String(toNumber(merged.pricingLayout.pricePerStop));

  const rawSelected = Array.isArray(merged.pricingLayout.selectedItems)
    ? merged.pricingLayout.selectedItems
    : [];

  merged.pricingLayout.selectedItems = rawSelected
    // If the API stored an explicit order, respect it; otherwise keep array order
    .slice()
    .sort((a, b) => toNumber(a?.order ?? 0) - toNumber(b?.order ?? 0))
    .map((item) => ({
      name: item?.name ?? '',
      type: item?.type === 'percentage' ? 'percentage' : 'flat',
      amount: String(toNumber(item?.amount))
    }))
    .filter((item) => item.name);

  return merged;
};

const Preferences = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddPricing, setShowAddPricing] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Drag & drop state (HTML5 DnD)
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_URL}/company-profile/preferences`
      );
      if (data.data) {
        setSettings(normalizeFetchedSettings(data.data));
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = (section, key) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section][key]
      }
    }));
  };

  // ============ PRICING LAYOUT FUNCTIONS ============
  const isItemSelected = (name) =>
    settings.pricingLayout.selectedItems.some(it => it.name === name);

  const togglePricingItem = (item) => {
    setSettings(prev => {
      const selected = prev.pricingLayout.selectedItems;
      const alreadySelected = selected.some(it => it.name === item.name);
      const updatedSelected = alreadySelected
        ? selected.filter(it => it.name !== item.name)
        : [...selected, { name: item.name, type: item.type, amount: '0' }];

      return {
        ...prev,
        pricingLayout: { ...prev.pricingLayout, selectedItems: updatedSelected }
      };
    });
  };

  const updateSelectedItem = (name, field, value) => {
    setSettings(prev => ({
      ...prev,
      pricingLayout: {
        ...prev.pricingLayout,
        selectedItems: prev.pricingLayout.selectedItems.map(item =>
          item.name === name ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const removeSelectedItem = (name) => {
    setSettings(prev => ({
      ...prev,
      pricingLayout: {
        ...prev.pricingLayout,
        selectedItems: prev.pricingLayout.selectedItems.filter(it => it.name !== name)
      }
    }));
  };

  // Shared reorder helper used by both the chevrons and drag & drop.
  // Reads only from the functional updater's `prev`, so rapid interactions
  // can't act on stale state.
  const reorderSelectedItems = (fromIndex, toIndex) => {
    setSettings(prev => {
      const items = [...prev.pricingLayout.selectedItems];
      if (
        fromIndex === toIndex ||
        fromIndex < 0 || fromIndex >= items.length ||
        toIndex < 0 || toIndex >= items.length
      ) {
        return prev;
      }
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return {
        ...prev,
        pricingLayout: { ...prev.pricingLayout, selectedItems: items }
      };
    });
  };

  const moveSelectedItem = (index, direction) =>
    reorderSelectedItems(index, direction === 'up' ? index - 1 : index + 1);

  // ---- Drag & drop handlers ----
  const handleDragStart = (index) => (e) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires data to be set for a drag to start
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (index) => (e) => {
    e.preventDefault(); // required to allow dropping
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = (index) => (e) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from !== null && from !== index) {
      reorderSelectedItems(from, index);
    }
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  // ============ ORDER TYPES ============
  const handleOrderTypeToggle = (type) => {
    setSettings(prev => ({
      ...prev,
      orderTypes: {
        ...prev.orderTypes,
        selected: prev.orderTypes.selected.includes(type)
          ? prev.orderTypes.selected.filter(t => t !== type)
          : [...prev.orderTypes.selected, type]
      }
    }));
  };

  // ============ SAVE ============
  const handleSave = async (e) => {
    e.preventDefault();

    // Light validation before saving
    for (const item of settings.pricingLayout.selectedItems) {
      const amount = toNumber(item.amount);
      if (amount < 0) {
        toast.error(`${item.name}: amount cannot be negative`);
        return;
      }
      if (item.type === 'percentage' && amount > 100 && item.name !== 'Gratuity') {
        toast.error(`${item.name}: percentage cannot exceed 100%`);
        return;
      }
    }
    if (toNumber(settings.pricingLayout.pricePerStop) < 0) {
      toast.error('Price per stop cannot be negative');
      return;
    }

    setSaving(true);
    try {
      // Build the payload with parsed numbers and a freshly computed `order`
      // that always matches the current on-screen arrangement.
      const payload = {
        ...settings,
        pricingLayout: {
          ...settings.pricingLayout,
          pricePerStop: toNumber(settings.pricingLayout.pricePerStop),
          selectedItems: settings.pricingLayout.selectedItems.map((item, i) => ({
            name: item.name,
            type: item.type,
            amount: toNumber(item.amount),
            order: i
          }))
        }
      };

      await axios.put(`${import.meta.env.VITE_URL}/company-profile/preferences`, payload);
      toast.success('Preferences saved');
      setShowAddPricing(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  // Order Types categories
  // Note: "Leisure" appears both as a category name and as an item under
  // "Sporting Event" — kept as-is to match existing business data, but worth
  // confirming with the product owner.
  const orderTypeCategories = [
    {
      name: 'Airport',
      items: ['Airport', 'Airport Drop Off', 'Airport Pick Up']
    },
    {
      name: 'Other',
      items: ['Anniversary', 'Bar/Bat Mitzvah', 'Birthday', 'Family Reunion', 'Funeral', 'Kids Birthday', 'Quinceanera', 'Sweet 16']
    },
    {
      name: 'Corporate',
      items: ['Business Trip', 'Corporate', 'Corporate Event', 'Personal Trip']
    },
    {
      name: 'Leisure',
      items: ['Holiday', 'Medical', 'Other', 'Point-to-Point', 'Rental', 'Seaport', 'Special Occasion', 'Train Station']
    },
    {
      name: 'School',
      items: ['Field Trip', 'Graduation', 'Prom/Homecoming', 'School', 'School Fundraiser']
    },
    {
      name: 'Sporting Event',
      items: ['Bar', 'Baseball', 'Basketball', 'Brew Tour', 'Concert', 'Day Tour', 'Football', 'Golf', 'Group Tour', 'Hockey', 'Leisure', 'Night Out', 'Sporting Event', 'Wine Tour']
    },
    {
      name: 'Wedding',
      items: ['Bachelor/Bachelorette', 'Bridal Party', 'Bride/Groom', 'Wedding']
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatTimeExample = (format) => {
    const date = new Date();
    date.setHours(14, 13, 0);
    if (format === '12h') {
      return date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDateExample = (format) => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return format === 'MM/DD/YYYY' ? `${mm}/${dd}/${yyyy}` : `${dd}/${mm}/${yyyy}`;
  };

  // ---- Live subtotal preview (computed, not hardcoded) ----
  const selectedItems = settings.pricingLayout.selectedItems;
  const lineAmounts = selectedItems.map(item => {
    const amount = toNumber(item.amount);
    const value = item.type === 'percentage' ? (BASE_RATE * amount) / 100 : amount;
    // Discounts reduce the total; everything else adds to it
    return item.name === 'Discount' ? -value : value;
  });
  const previewTotal = BASE_RATE + lineAmounts.reduce((sum, v) => sum + v, 0);

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* ============ PRICING LAYOUT ============ */}
      <div>
        <SectionTitle>Pricing Layout</SectionTitle>

        <div className="space-y-4">
          {/* Selected Items (reorder via drag or arrows) */}
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300 min-h-[100px]">
            <p className="text-sm text-gray-500 mb-3">Line items in subtotal</p>

            {selectedItems.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No pricing items selected. Click "Add Pricing" to add items.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedItems.map((item, index) => (
                  <div
                    key={item.name}
                    draggable
                    onDragStart={handleDragStart(index)}
                    onDragOver={handleDragOver(index)}
                    onDrop={handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 bg-white p-3 rounded-lg border shadow-sm transition-colors ${
                      dragOverIndex === index ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200'
                    }`}
                  >
                    {/* Drag Handle */}
                    <div className="cursor-move text-gray-400 hover:text-gray-600" title="Drag to reorder">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Item Name */}
                    <span className="text-sm font-medium min-w-[120px]">{item.name}</span>

                    {/* Type Toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded p-0.5">
                      <button
                        type="button"
                        onClick={() => updateSelectedItem(item.name, 'type', 'percentage')}
                        className={`px-3 py-0.5 text-xs rounded transition-colors ${
                          item.type === 'percentage' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedItem(item.name, 'type', 'flat')}
                        className={`px-3 py-0.5 text-xs rounded transition-colors ${
                          item.type === 'flat' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        $
                      </button>
                    </div>

                    {/* Amount Input (string state; parsed on save) */}
                    <div className="relative flex-1 max-w-[120px]">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={item.amount}
                        onChange={(e) => updateSelectedItem(item.name, 'amount', e.target.value)}
                        onBlur={(e) => {
                          // Normalize on blur so "" / "." become "0"
                          updateSelectedItem(item.name, 'amount', String(toNumber(e.target.value)));
                        }}
                        className={`${inputCls} py-1.5 text-sm`}
                        placeholder={item.type === 'flat' ? '0.00' : '0'}
                        step="0.01"
                        min="0"
                      />
                      {item.type === 'percentage' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                      )}
                    </div>

                    {/* Move Buttons */}
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => moveSelectedItem(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        aria-label={`Move ${item.name} up`}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSelectedItem(index, 'down')}
                        disabled={index === selectedItems.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        aria-label={`Move ${item.name} down`}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeSelectedItem(item.name)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${item.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subtotal Preview — now calculated from the actual line items */}
          {selectedItems.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-400 mb-2">
                Preview based on a sample ${BASE_RATE.toFixed(2)} base rate
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Rate</span>
                  <span className="font-medium">${BASE_RATE.toFixed(2)}</span>
                </div>
                {selectedItems.map((item, index) => (
                  <div key={item.name} className="flex justify-between text-sm text-gray-600">
                    <span>
                      {item.name}
                      {item.type === 'percentage' && ` (${toNumber(item.amount)}%)`}
                    </span>
                    <span className={lineAmounts[index] < 0 ? 'text-green-600' : ''}>
                      {lineAmounts[index] < 0 ? '-' : ''}${Math.abs(lineAmounts[index]).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-blue-600">
                  <span>Total</span>
                  <span>${previewTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Add Pricing Button */}
          <div className="relative z-20">
            <button
              type="button"
              onClick={() => setShowAddPricing(prev => !prev)}
              className="relative z-20 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Pricing
            </button>

            {showAddPricing && (
              <>
                {/* Click-outside backdrop sits BELOW the button/dropdown */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowAddPricing(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-80 overflow-y-auto">
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Select Pricing Items
                    </p>
                    <div className="space-y-0.5">
                      {DEFAULT_AVAILABLE_ITEMS.map((item) => (
                        <label
                          key={item.name}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isItemSelected(item.name)}
                            onChange={() => togglePricingItem(item)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{item.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Price Per Stop */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <FieldLabel>Price Per Stop</FieldLabel>
            <div className="flex items-center gap-4">
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={settings.pricingLayout.pricePerStop}
                  onChange={(e) =>
                    setSettings(prev => ({
                      ...prev,
                      pricingLayout: { ...prev.pricingLayout, pricePerStop: e.target.value }
                    }))
                  }
                  onBlur={(e) =>
                    setSettings(prev => ({
                      ...prev,
                      pricingLayout: { ...prev.pricingLayout, pricePerStop: String(toNumber(e.target.value)) }
                    }))
                  }
                  className={`${inputCls} pl-7`}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              <span className="text-sm text-gray-500">
                Additional stops on transfer trips will be priced at ${toNumber(settings.pricingLayout.pricePerStop).toFixed(2)} and automatically included in the base rate.
              </span>
            </div>
          </div>

          {/* Toggles */}
          <div className="mt-4 bg-white border border-gray-200 rounded-lg">
            <Toggle
              enabled={settings.pricingLayout.enableAmountDueOnDriverApp}
              onChange={() => handleToggle('pricingLayout', 'enableAmountDueOnDriverApp')}
              label="Enable Amount Due on driver app"
              description="Amount Due on driver app is currently disabled. Enabling this will show the amount due to drivers."
            />

            <Toggle
              enabled={settings.pricingLayout.enableLuggageOptions}
              onChange={() => handleToggle('pricingLayout', 'enableLuggageOptions')}
              label="Enable luggage options for orders"
              description="Access to add luggage types to orders is currently turned off."
            />

            <Toggle
              enabled={settings.pricingLayout.showTripStartEndTimes}
              onChange={() => handleToggle('pricingLayout', 'showTripStartEndTimes')}
              label="Show Trip Start and End Times"
              description="Displays estimated Start and End Times using Garage location to Pick-up and Drop-off to Garage. This will not be visible to Customers. Only visible in Dispatch View and Driver App."
              pro={true}
            />
          </div>
        </div>
      </div>

      {/* ============ TIME & DATE FORMAT ============ */}
      <div className="pt-4 border-t border-gray-200">
        <SectionTitle>Time Format</SectionTitle>
        <p className="text-sm text-gray-500 mb-4">
          The format used to display times to you and your customers
        </p>

        <div className="flex gap-6 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="timeFormat"
              value="12h"
              checked={settings.timeFormat === '12h'}
              onChange={() => setSettings(prev => ({ ...prev, timeFormat: '12h' }))}
              className="w-4 h-4"
            />
            <span className="text-sm">12-hour</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="timeFormat"
              value="24h"
              checked={settings.timeFormat === '24h'}
              onChange={() => setSettings(prev => ({ ...prev, timeFormat: '24h' }))}
              className="w-4 h-4"
            />
            <span className="text-sm">24-hour</span>
          </label>
        </div>
        <p className="text-sm text-gray-400">
          Example: {formatTimeExample(settings.timeFormat)}
        </p>

        <div className="mt-6">
          <SectionTitle>Date Format</SectionTitle>
          <p className="text-sm text-gray-500 mb-4">
            The format used to display dates to you and your customers
          </p>

          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="dateFormat"
                value="MM/DD/YYYY"
                checked={settings.dateFormat === 'MM/DD/YYYY'}
                onChange={() => setSettings(prev => ({ ...prev, dateFormat: 'MM/DD/YYYY' }))}
                className="w-4 h-4"
              />
              <span className="text-sm">MM/DD/YYYY</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="dateFormat"
                value="DD/MM/YYYY"
                checked={settings.dateFormat === 'DD/MM/YYYY'}
                onChange={() => setSettings(prev => ({ ...prev, dateFormat: 'DD/MM/YYYY' }))}
                className="w-4 h-4"
              />
              <span className="text-sm">DD/MM/YYYY</span>
            </label>
          </div>
          <p className="text-sm text-gray-400">
            Example: {formatDateExample(settings.dateFormat)}
          </p>
        </div>
      </div>

      {/* ============ ORDER TYPES ============ */}
      <div className="pt-4 border-t border-gray-200">
        <SectionTitle>Order Types</SectionTitle>

        <div className="mb-4">
          <FieldLabel>Order Type Requirement</FieldLabel>
          <p className="text-sm text-gray-500 mb-2">
            Controls whether order type is required when creating reservations
          </p>
          <div className="flex gap-6">
            {['required', 'optional', 'disabled'].map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="orderTypeRequirement"
                  value={option}
                  checked={settings.orderTypes.requirement === option}
                  onChange={() => setSettings(prev => ({
                    ...prev,
                    orderTypes: { ...prev.orderTypes, requirement: option }
                  }))}
                  className="w-4 h-4"
                />
                <span className="text-sm capitalize">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Select all order types you would like to offer
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4">
          {orderTypeCategories.map((category) => (
            <div key={category.name} className="space-y-1.5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {category.name}
              </h3>
              {category.items.map((type) => (
                <label key={type} className="flex items-center gap-2 py-0.5">
                  <input
                    type="checkbox"
                    checked={settings.orderTypes.selected.includes(type)}
                    onChange={() => handleOrderTypeToggle(type)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ============ SAVE BUTTON ============ */}
      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default Preferences;