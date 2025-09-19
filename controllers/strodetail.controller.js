const Validator = require('fastest-validator');
const { Op } = require("sequelize");
const models = require('../models');
const { QueryTypes } = require('sequelize');

async function saveAddress(req, res) {
    try {
        const { Address } = req.body;

        if (!Address) {
            return res.status(400).json({
                success: false,
                message: "Address is required"
            });
        }

        const result = await models.Stordetail.create({ Address });

        return res.status(201).json({ // 201 for resource creation
            success: true,
            message: "Address created successfully",
            result: result
        });
    } catch (error) {
        console.error('Address creation error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to create address",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get address by ID
async function getAddress(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID is required"
            });
        }

        const address = await models.Stordetail.findByPk(id);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Address fetched successfully",
            result: address
        });
    } catch (error) {
        console.error('Get address error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch address",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

async function updateAddress(req, res) {
    try {
        const { id } = req.params;
        const { Address } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID is required"
            });
        }

        if (!Address) {
            return res.status(400).json({
                success: false,
                message: "Address is required"
            });
        }

        const address = await models.Stordetail.findByPk(id);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        address.Address = Address;
        const result = await address.save();

        return res.status(200).json({
            success: true,
            message: "Address updated successfully",
            result: result
        });
    } catch (error) {
        console.error('Address update error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to update address",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}
module.exports = {
    saveAddress: saveAddress,
    getAddress: getAddress,
    updateAddress: updateAddress
}