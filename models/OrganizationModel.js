const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    password: String,
    isPrivate: Boolean,
});
OrganizationSchema.index(
    {
        name: 1
    },
    {
        collation: {
            locale: 'en',
            strength: 2
        }
    }
)
const Organization = mongoose.model('Organization', OrganizationSchema);

module.exports = Organization;