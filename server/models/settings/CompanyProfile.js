const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema({

    // ============ OPERATOR ID (CRITICAL) ============
    operatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
        unique: true // Each operator has ONE profile
    },

    // ================================================general================================================
    // ============ COMPANY TAB ============
    name: { type: String, trim: true, default: 'My Transportation Company' },
    logo: { url: String, filename: String },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    website: { type: String, trim: true },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        country: { type: String, trim: true, default: 'US' }
    },
    permitNumber: { type: String, trim: true },
    generalEmail: { type: String, trim: true, lowercase: true },
    bookingEmail: { type: String, trim: true, lowercase: true },

    // ============ COMMUNICATION TAB ============
    communication: {
        // Toggles
        sendAutomatedChargeEmails: { type: Boolean, default: false },
        sendAutomatedCancellationEmails: { type: Boolean, default: true },

        // Custom Domain
        customDomain: { type: String, trim: true, default: '' },
        domainEmail: { type: String, trim: true, lowercase: true, default: '' },
        domainVerified: { type: Boolean, default: false },

        // SMTP Settings (for sending emails)
        smtp: {
            host: { type: String, trim: true, default: '' },
            port: { type: Number, default: 587 },
            secure: { type: Boolean, default: false },
            username: { type: String, trim: true, default: '' },
            password: { type: String, trim: true, default: '' }
        }
    },

    // ============ PAYMENTS TAB ============
    payments: {
        businessType: { type: String, trim: true, default: '' },
        businessName: { type: String, trim: true, default: '' },
        ein: { type: String, trim: true, default: '' },
        bankAccounts: [{
            accountName: { type: String, trim: true },
            routingNumber: { type: String, trim: true },
            accountNumber: { type: String, trim: true },
            accountType: { type: String, enum: ['checking', 'savings'], default: 'checking' },
            isDefault: { type: Boolean, default: false }
        }],
        isSetupComplete: { type: Boolean, default: false }
    },

    // ============ PREFERENCES TAB ============
    preferences: {
        // ============ PRICING LAYOUT ============
        pricingLayout: {
            // Available pricing items (show in Add Pricing dropdown)
            availableItems: [{
                name: { type: String, trim: true },
                enabled: { type: Boolean, default: false },
                type: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
                amount: { type: Number, default: 0 }
            }],
            // Selected items in order (for drag functionality)
            selectedItems: [{
                name: { type: String, trim: true },
                type: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
                amount: { type: Number, default: 0 },
                order: { type: Number, default: 0 }
            }],
            pricePerStop: {
                type: Number,
                default: 0
            },
            enableAmountDueOnDriverApp: {
                type: Boolean,
                default: false
            },
            enableLuggageOptions: {
                type: Boolean,
                default: false
            },
            showTripStartEndTimes: {
                type: Boolean,
                default: false
            }
        },
        timeFormat: {
            type: String,
            enum: ['12h', '24h'],
            default: '12h'
        },

        dateFormat: {
            type: String,
            enum: ['MM/DD/YYYY', 'DD/MM/YYYY'],
            default: 'MM/DD/YYYY'
        },

        // ============ ORDER TYPES ============
        orderTypes: {
            requirement: {
                type: String,
                enum: ['required', 'optional', 'disabled'],
                default: 'optional'
            },
            selected: {
                type: [String],
                default: [
                    // Airport
                    'Airport',
                    'Airport Drop Off',
                    'Airport Pick Up',
                    // Other
                    'Anniversary',
                    'Bar/Bat Mitzvah',
                    'Birthday',
                    'Family Reunion',
                    'Funeral',
                    'Kids Birthday',
                    'Quinceanera',
                    'Sweet 16',
                    // Corporate
                    'Business Trip',
                    'Corporate',
                    'Corporate Event',
                    'Personal Trip',
                    // Leisure
                    'Holiday',
                    'Medical',
                    'Other',
                    'Point-to-Point',
                    'Rental',
                    'Seaport',
                    'Special Occasion',
                    'Train Station',
                    // School
                    'Field Trip',
                    'Graduation',
                    'Prom/Homecoming',
                    'School',
                    'School Fundraiser',
                    // Sporting Event
                    'Bar',
                    'Baseball',
                    'Basketball',
                    'Brew Tour',
                    'Concert',
                    'Day Tour',
                    'Football',
                    'Golf',
                    'Group Tour',
                    'Hockey',
                    'Leisure',
                    'Night Out',
                    'Sporting Event',
                    'Wine Tour',
                    // Wedding
                    'Bachelor/Bachelorette',
                    'Bridal Party',
                    'Bride/Groom',
                    'Wedding'
                ]
            }
        }
    },


    // Customer Portal Section
    customerPortal: {
        // ============ PAYMENTS TAB ============
        payments: {
            creditCardEnabled: { type: Boolean, default: true },
            paymentPreference: {
                type: String,
                enum: ['no_charge', 'deposit', 'full_charge'],
                default: 'full_charge'
            },
            depositAmount: { type: Number, default: 0 },
            depositType: { type: String, enum: ['percentage', 'flat'], default: 'flat' }
        },

        // ============ SETTINGS TAB ============
        settings: {
            // Trip Types
            tripTypes: {
                oneWay: { type: Boolean, default: true },
                roundTrip: { type: Boolean, default: true },
                hourly: { type: Boolean, default: true }
            },

            // Gratuity
            gratuity: {
                enabled: { type: Boolean, default: false },
                percentages: [{ type: Number, default: 15 }],
                cashOption: { type: Boolean, default: false },
                customOption: { type: Boolean, default: true },
                minPercentage: { type: Number, default: 15 },
                optional: { type: Boolean, default: true }
            },

            // Customer Signature (Terms & Conditions)
            customerSignature: {
                enabled: { type: Boolean, default: false },
                termsId: { type: mongoose.Schema.Types.ObjectId, ref: 'TermsAndConditions' }
            },

            // Reservation Cutoff
            reservationCutoff: {
                enabled: { type: Boolean, default: false },
                hours: { type: Number, default: 0 },
                type: { type: String, enum: ['hours', 'days'], default: 'hours' }
            },

            // Request Changes to Trip
            requestChanges: {
                automated: { type: Boolean, default: false },
                cutoffPeriod: { type: Number, default: 7 },
                allowCancellation: { type: Boolean, default: false }
            },

            // Booking Location Restriction
            locationRestriction: {
                enabled: { type: Boolean, default: false },
                country: { type: String, default: 'US' }
            },

            // Skip Vehicle Selection
            skipVehicleSelection: {
                enabled: { type: Boolean, default: false },
                defaultVehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }
            },

            // Vehicle Order (Coming Soon)
            vehicleOrder: {
                type: String,
                enum: ['price', 'capacity', 'name', 'manual'],
                default: 'price'
            },
            vehicleOrderDirection: {
                type: String,
                enum: ['ascending', 'descending'],
                default: 'ascending'
            }
        },

        // ============ BRANDING TAB ============
        branding: {
            logo: {
                url: { type: String, default: '' },
                filename: { type: String, default: '' }
            },
            primaryColor: { type: String, default: '#2563EB' },
            secondaryColor: { type: String, default: '#1E293B' },
            accentColor: { type: String, default: '#F59E0B' },
            fontFamily: { type: String, default: 'Inter' },
            buttonStyle: {
                type: String,
                enum: ['rounded', 'pill', 'square'],
                default: 'rounded'
            }
        },

        // ============ PROMO CODES TAB ============
        promoCode: {
            enabled: { type: Boolean, default: false },
            autoApply: { type: Boolean, default: false },
            codes: [{
                code: { type: String, trim: true },
                discountType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
                discountAmount: { type: Number, default: 0 },
                validFrom: { type: Date },
                validUntil: { type: Date },
                usageLimit: { type: Number, default: 0 },
                usedCount: { type: Number, default: 0 },
                isActive: { type: Boolean, default: true }
            }]
        }
    }
}, { timestamps: true });

// Get or create profile for a specific operator
companyProfileSchema.statics.getCompanyProfile = async function(operatorId) {
    if (!operatorId) {
        throw new Error('operatorId is required to get company profile');
    }

    let profile = await this.findOne({ operatorId });
    
    if (!profile) {
        profile = await this.create({
            operatorId: operatorId,
            name: 'My Transportation Company',
            email: 'info@mycompany.com',
            phone: '+1 234 567 8900'
        });
    }
    return profile;
};

// ✅ FIXED: Get profile by operator ID
companyProfileSchema.statics.getProfileByOperator = async function(operatorId) {
    return await this.findOne({ operatorId });
};

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);