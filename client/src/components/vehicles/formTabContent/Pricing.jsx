import React from 'react';
import { Plus, Trash2, AlertTriangle, Info } from 'lucide-react';

const WEEKEND_OPTIONS = [
  { value: 'Fri', label: 'Friday' },
  { value: 'Sat', label: 'Saturday' },
  { value: 'Sun', label: 'Sunday' }
];

const Pricing = ({ formData, setFormData, errors = {} }) => {
  // Helper function to update nested form data
  const updateFormData = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        // Create nested objects if they don't exist
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  // Get nested value from formData
  const getValue = (path) => {
    const keys = path.split('.');
    let current = formData;
    for (const key of keys) {
      if (current === undefined || current === null) return undefined;
      current = current[key];
    }
    return current;
  };

  // Toggle Switch Component
  const ToggleSwitch = ({ checked, onChange, label, tooltip }) => (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      {label}
      {tooltip && <Info size={14} className="text-gray-400" />}
      <div className="relative inline-block w-11 h-6">
        <input
          type="checkbox"
          className="opacity-0 w-0 h-0"
          checked={checked || false}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}>
          <span className={`absolute left-0.5 bottom-0.5 bg-white w-5 h-5 transition-transform duration-300 rounded-full ${checked ? 'translate-x-5' : ''}`} />
        </span>
      </div>
    </label>
  );

  // Render Transfer Section
  const renderTransferSection = () => {
    const transfer = getValue('price.transfer') || {
      tieredPricing: false,
      deadheadRatePerMile: '',
      minimumTotalBaseRate: '',
      transferRate: '',
      transferRateType: 'per_mile',
      tierMode: 'incremental',
      tiers: []
    };

    const isTiered = transfer.tieredPricing;
    const brauto = getValue('price.BRAuto') || false;

    // Add tier handler
    const addTransferTier = () => {
      const tiers = [...(transfer.tiers || [])];
      tiers.push({ milesLimit: undefined, rate: '', rateType: 'per_mile' });
      updateFormData('price.transfer.tiers', tiers);
    };

    const removeTransferTier = (index) => {
      const tiers = [...(transfer.tiers || [])];
      tiers.splice(index, 1);
      updateFormData('price.transfer.tiers', tiers);
    };

    const updateTransferTier = (index, field, value) => {
      const tiers = [...(transfer.tiers || [])];
      tiers[index] = { ...tiers[index], [field]: value };
      updateFormData('price.transfer.tiers', tiers);
    };

    return (
      <div className="bg-white rounded-lg p-6 mb-4 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Transfer Pricing</h3>
          <ToggleSwitch
            checked={isTiered}
            onChange={(checked) => updateFormData('price.transfer.tieredPricing', checked)}
            label="Tiered Pricing"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brauto && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Total Base Rate
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={transfer.minimumTotalBaseRate || ''}
                onChange={(e) => updateFormData('price.transfer.minimumTotalBaseRate', e.target.value)}
                placeholder="Enter minimum rate"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deadhead Rate per Mile
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={transfer.deadheadRatePerMile || ''}
              onChange={(e) => updateFormData('price.transfer.deadheadRatePerMile', e.target.value)}
              placeholder="Enter deadhead rate"
              step="0.01"
            />
          </div>
        </div>

        {!isTiered ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transfer Rate
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={transfer.transferRate || ''}
                onChange={(e) => updateFormData('price.transfer.transferRate', e.target.value)}
                placeholder="Enter transfer rate"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rate Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={transfer.transferRateType || 'per_mile'}
                onChange={(e) => updateFormData('price.transfer.transferRateType', e.target.value)}
              >
                <option value="per_mile">Per Mile</option>
                <option value="flat">Flat Rate</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tier Mode
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={transfer.tierMode || 'incremental'}
                onChange={(e) => updateFormData('price.transfer.tierMode', e.target.value)}
              >
                <option value="incremental">Incremental</option>
                <option value="fixed_tier">Fixed Tier</option>
              </select>
            </div>

            <div className="space-y-3">
              {transfer.tiers?.map((tier, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {index === transfer.tiers.length - 1 ? 'Remaining Miles' : 'Miles Limit'}
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={tier.milesLimit || ''}
                        onChange={(e) => updateTransferTier(index, 'milesLimit', e.target.value)}
                        placeholder={index === transfer.tiers.length - 1 ? 'Unlimited' : 'Enter limit'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Rate</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={tier.rate || ''}
                        onChange={(e) => updateTransferTier(index, 'rate', e.target.value)}
                        placeholder="Enter rate"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Rate Type</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={tier.rateType || 'per_mile'}
                        onChange={(e) => updateTransferTier(index, 'rateType', e.target.value)}
                      >
                        <option value="per_mile">Per Mile</option>
                        <option value="flat">Flat Rate</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                      {transfer.tiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTransferTier(index)}
                          className="text-red-600 hover:text-red-800 p-2 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addTransferTier}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                <Plus size={18} /> Add Tier
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Hourly Section
  const renderHourlySection = () => {
    const hourly = getValue('price.hourly') || {
      coveredDeadheadDuration: 'disabled',
      weekdays: {
        tieredPricing: false,
        hourlyMinimum: '',
        hourlyRate: '',
        rateType: 'per_hour',
        tiers: []
      },
      weekends: {
        days: [],
        block: {
          tieredPricing: false,
          hourlyMinimum: '',
          hourlyRate: '',
          rateType: 'per_hour',
          tiers: []
        }
      }
    };

    const brauto = getValue('price.BRAuto') || false;

    // Helper for updating hourly tiers
    const addHourlyTier = (path) => {
      const current = getValue(path) || { tiers: [] };
      const tiers = [...(current.tiers || [])];
      tiers.push({ milesLimit: undefined, rate: '', rateType: 'per_hour' });
      updateFormData(`${path}.tiers`, tiers);
    };

    const removeHourlyTier = (path, index) => {
      const current = getValue(path) || { tiers: [] };
      const tiers = [...(current.tiers || [])];
      tiers.splice(index, 1);
      updateFormData(`${path}.tiers`, tiers);
    };

    const updateHourlyTier = (path, index, field, value) => {
      const current = getValue(path) || { tiers: [] };
      const tiers = [...(current.tiers || [])];
      tiers[index] = { ...tiers[index], [field]: value };
      updateFormData(`${path}.tiers`, tiers);
    };

    // Render hourly block (weekdays or weekends)
    const renderHourlyBlock = (path, title, showTierToggle = true) => {
      const block = getValue(path) || {
        tieredPricing: false,
        hourlyMinimum: '',
        hourlyRate: '',
        rateType: 'per_hour',
        tiers: []
      };
      const isTiered = block.tieredPricing || false;

      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium">{title}</h4>
            {showTierToggle && (
              <ToggleSwitch
                checked={isTiered}
                onChange={(checked) => updateFormData(`${path}.tieredPricing`, checked)}
                label="Tiered Pricing"
              />
            )}
          </div>

          {brauto && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hourly Minimum
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={block.hourlyMinimum || ''}
                  onChange={(e) => updateFormData(`${path}.hourlyMinimum`, e.target.value)}
                  placeholder="Hours"
                  step="0.5"
                />
                <span className="text-sm text-gray-600">Hours</span>
              </div>
            </div>
          )}

          {!isTiered ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={block.hourlyRate || ''}
                    onChange={(e) => updateFormData(`${path}.hourlyRate`, e.target.value)}
                    placeholder="Enter rate"
                    step="0.01"
                  />
                  <span className="text-sm text-gray-600">per hour</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={block.rateType || 'per_hour'}
                  onChange={(e) => updateFormData(`${path}.rateType`, e.target.value)}
                >
                  <option value="per_hour">Per Hour</option>
                  <option value="flat">Flat Rate</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {block.tiers?.map((tier, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {index === block.tiers.length - 1 ? 'Remaining Hours' : 'Hours Limit'}
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={tier.milesLimit || ''}
                        onChange={(e) => updateHourlyTier(path, index, 'milesLimit', e.target.value)}
                        placeholder={index === block.tiers.length - 1 ? 'Unlimited' : 'Enter limit'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Rate</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={tier.rate || ''}
                        onChange={(e) => updateHourlyTier(path, index, 'rate', e.target.value)}
                        placeholder="Enter rate"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Rate Type</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={tier.rateType || 'per_hour'}
                        onChange={(e) => updateHourlyTier(path, index, 'rateType', e.target.value)}
                      >
                        <option value="per_hour">Per Hour</option>
                        <option value="flat">Flat Rate</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                      {block.tiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHourlyTier(path, index)}
                          className="text-red-600 hover:text-red-800 p-2 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addHourlyTier(path)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                <Plus size={18} /> Add Tier
              </button>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Hourly Pricing</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Covered Deadhead Duration
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={hourly.coveredDeadheadDuration || 'disabled'}
              onChange={(e) => updateFormData('price.hourly.coveredDeadheadDuration', e.target.value)}
              placeholder="disabled"
            />
            <span className="text-sm text-gray-600">Hours (or "disabled")</span>
          </div>
        </div>

        {/* Weekdays */}
        {renderHourlyBlock('price.hourly.weekdays', 'Weekdays')}

        {/* Weekends */}
        <div className="mt-4">
          <h4 className="font-medium mb-3">Weekends</h4>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Weekend Days
            </label>
            <select
              multiple
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
              value={hourly.weekends.days || []}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                updateFormData('price.hourly.weekends.days', values);
              }}
            >
              {WEEKEND_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple days</p>
          </div>

          {renderHourlyBlock('price.hourly.weekends.block', 'Weekend Rates', true)}
        </div>
      </div>
    );
  };

  const brauto = getValue('price.BRAuto') || false;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Pricing Configuration</h2>
        <ToggleSwitch
          checked={brauto}
          onChange={(checked) => updateFormData('price.BRAuto', checked)}
          label="Enable Base Rate Automation"
          tooltip="When enabled, sets minimum rates and requirements"
        />
      </div>

      {!brauto && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="text-yellow-600 mt-0.5" size={18} />
          <p className="text-sm text-yellow-800">
            Base Rate Automation is disabled. Enable it to set minimum rates and requirements for your vehicle.
          </p>
        </div>
      )}

      {renderTransferSection()}
      
      <div className="mt-4">
        {renderHourlySection()}
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4 flex items-start gap-2">
          <AlertTriangle className="text-red-600 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-medium text-red-800">Please fix the following errors:</p>
            <ul className="list-disc list-inside text-sm text-red-700">
              {Object.entries(errors).map(([key, value]) => (
                <li key={key}>{key}: {value}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;