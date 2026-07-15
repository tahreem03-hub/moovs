const mongoose = require("mongoose");
const { schema } = mongoose
const quoteFormSchema = new Schema({
    name: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: ["quote", "trip", "customer"],
        required: true
    },

    fields: [
        {
            key: {
                type: String,
                required: true
            },

            label: {
                type: String,
                required: true
            },

            fieldType: {
                type: String,
                enum: ["text", "number", "date", "select", "textarea"],
                required: true
            },

            options: [
                {
                    type: String
                }
            ],

            /* using the property name required inside the field object because it can
            be confused with Mongoose's required validator */
            isRequired: {
                type: Boolean,
                default: false
            },

            isActive: {
                type: Boolean,
                default: true
            }
        }
    ]
}, {
    timestamps: true
})