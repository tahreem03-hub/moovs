const mongoose = require('mongoose')
const { Schema } = mongoose

const childSeatSchema = new Schema({
    enabled: { type: Boolean, default: false },
    quantity: { type: Number, min: 1, default: 1 },
    amount: { type: Number, min: 0, default: 0 },
    description: { type: String, trim: true }
}, { _id: false })

const featureSchema = new Schema({
    general: {
        type: [String],
        enum: ["AC", "Bathroom", "Dance Pole", "In-Vehicle Bar", "Luggage",
            "Refrigerator", "Tables", "Trash Can", "Wheelchair Accessible", "Ice Chest"]
    },
    multiMedia: {
        type: [String],
        enum: ["AUX", "Bluetooth", "DVD Player", "Game Console", "Karaoke",
            "TV", "USB", "Wifi", "Power Outlets"]
    },
    policies: {
        type: [String],
        enum: ["Alcohol Friendly", "Food Allowed", "Pets Allowed", "Smoking Allowed"]
    },
    childSeats: {
        rearFacing: childSeatSchema,
        forwardFacing: childSeatSchema,
        booster: childSeatSchema
    }
})

const tierSchema = new Schema({
    milesLimit: Number,
    rate: { type: Number, required: true },
    rateType: { type: String, enum: ["per_mile", "flat"], default: "per_mile" }
}, { _id: false })

const hourlyBlockSchema = new Schema({
    tieredPricing: { type: Boolean, default: false },
    hourlyMinimum: {
        type: String,
        required: function () {
            return this.parent().parent().BRAuto === true
        }
    },
    hourlyRate: {
        type: Number,
        required: function () {
            return this.parent().parent().BRAuto === true && this.tieredPricing === false
        }
    },
    rateType: { type: String, enum: ["per_hour", "flat"], default: "per_hour" },
    tiers: {
        type: [tierSchema],
        required: function () { return this.tieredPricing === true }
    }
}, { _id: false })

const priceSchema = new Schema({
    BRAuto: { type: Boolean, default: false },
    transfer: {
        tieredPricing: { type: Boolean, default: false },
        deadheadRatePerMile: {
            type: Number,
            required: function () {
                return this.BRAuto === true || this.tieredPricing === true
            }
        },
        minimumTotalBaseRate: {
            type: Number,
            required: function () {
                return this.BRAuto === true && this.tieredPricing === false
            }
        },
        transferRate: {
            type: Number,
            required: function () {
                return this.BRAuto === true && this.tieredPricing === false
            }
        },
        transferRateType: { type: String, enum: ["per_mile", "flat"], default: "per_mile" },
        tierMode: { type: String, enum: ["incremental", "fixed_tier"] },
        tiers: {
            type: [tierSchema],
            required: function () { return this.tieredPricing === true }
        }
    },
    hourly: {
        coveredDeadheadDuration: { type: String, default: "disabled" },
        weekdays: hourlyBlockSchema,
        weekends: {
            days: [{ type: String, enum: ["Fri", "Sat", "Sun"] }],
            block: hourlyBlockSchema
        }
    }
})

const vehicleSchema = new Schema({
    // ============ OPERATOR ID (CRITICAL) ============
    operatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    id: { type: String, unique: true },

    /* required info */
    name: { type: String, trim: true, required: true },
    type: { type: String, trim: true, required: true },
    passengerCapacity: { type: Number, min: 0, required: true },

    /* optional info */
    licenseNo: { type: String },
    description: { type: String, trim: true },
    exteriorColor: { type: String, trim: true },
    vinNumber: { type: String },
    cancellationPolicy: { type: Number },
    insurancePolicy: { type: Number },
    garageLocation: { type: String },

    /* photos */
    images: {
        type: [{
            url: { type: String },
            isPrimary: { type: Boolean, default: false }
        }],
        validate: {
            validator: function (imgs) {
                return imgs.filter(img => img.isPrimary).length <= 1
            },
            message: "Only one photo can be marked as primary"
        }
    },

    /* features */
    features: featureSchema,

    /* pricing */
    price: priceSchema,

    /* customer portal settings */
    display: { type: Boolean, default: true },
    enableBRAuto: { type: Boolean, default: true },
    reservationReq: { type: Boolean, default: false },
    blockQuoteReq: { type: Boolean },
    blockResOnConflict: { type: Boolean },

    // ============ CREATED BY (Who created this vehicle) ============
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    }

}, { timestamps: true })

module.exports = mongoose.model("Vehicle", vehicleSchema)