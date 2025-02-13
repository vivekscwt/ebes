const Validator = require('fastest-validator');
const { Op } = require("sequelize");
const models = require('../models');
const { QueryTypes } = require('sequelize');

//Save Settings Data
const saveData = async (req, res) => {
    try {
        const { metaKey, metaValue } = req.body; 

        // Validate input
        const v = new Validator();
        const schema = {
            metaKey: { type: "string", optional: false },
            metaValue: { type: "string", optional: false }
        };
        const validate = v.validate(req.body, schema);

        if (validate.length > 0) { // Corrected validation check
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validate // Fixed variable name
            });   
        }

        // Check if metaKey already exists
        const existingMeta = await models.Setting.findOne({ where: { metaKey } });

        if (existingMeta) {
            return res.status(409).json({
                success: false,
                message: "Meta Key already exists!",
            });
        }

        // Save data
        const newSetting = await models.Setting.create({ metaKey, metaValue });

        return res.status(201).json({
            success: true,
            message: "Setting saved successfully.",
            result: newSetting
        });

    } catch (error) {
        console.error("Error saving data:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message
        });
    }
};

//Get All Settings Data
const getAllData = async (req, res) => {
    try {
        // Fetch all settings data
        const settings = await models.Setting.findAll();

        return res.status(200).json({
            success: true,
            message: "All settings data fetched successfully.",
            result: settings
        });

    } catch (error) {
        console.error("Error fetching settings data:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message
        });
    }
};

//Get Settings Data By Meta Key
const getDataByKey = async (req, res) => {
    try {
        const { metaKey } = req.body; 

        // Validate input
        const v = new Validator();
        const schema = {
            metaKey: { type: "string", optional: false, min: 1 }
        };
        const validate = v.validate(req.body, schema);

        if (validate.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validate
            });
        }

        // Fetch data by metaKey
        const data = await models.Setting.findOne({ where: { metaKey } });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "No data found for the provided metaKey."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Data fetched successfully.",
            result: data
        });

    } catch (error) {
        console.error("Error fetching data by key:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message
        });
    }
};

//Update Settings Data
const updateDataByKey = async (req, res) => {
    try {
        const { metaKey, metaValue } = req.body;

        // Validate request
        if (!metaKey || typeof metaKey !== "string") {
            return res.status(400).json({ success: false, message: "metaKey is required and must be a string." });
        }
        if (typeof metaValue !== "string") {
            return res.status(400).json({ success: false, message: "metaValue must be a string." });
        }

        // Check if the setting exists
        const existingMeta = await models.Setting.findOne({ where: { metaKey } });

        if (!existingMeta) {
            return res.status(404).json({ success: false, message: "Meta Key not found!" });
        }

        // Update the setting
        await models.Setting.update({ metaValue }, { where: { metaKey } });

        return res.status(200).json({
            success: true,
            message: "Setting updated successfully.",
            result:{
                "updatedKey": metaKey,
                "updatedValue": metaValue
            }
        });

    } catch (error) {
        console.error("Error updating setting:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message
        });
    }
};

//Delete Settings Data
const deleteDataByKey = async (req, res) => {
    try {
        const { metaKey } = req.body;

        // Validate request
        if (!metaKey || typeof metaKey !== "string") {
            return res.status(400).json({ success: false, message: "metaKey is required and must be a string." });
        }

        // Check if the setting exists
        const existingMeta = await models.Setting.findOne({ where: { metaKey } });

        if (!existingMeta) {
            return res.status(404).json({ success: false, message: "Meta Key not found!" });
        }

        // Delete the setting
        await models.Setting.destroy({ where: { metaKey } });

        return res.status(200).json({
            success: true,
            message: "Setting deleted successfully.",
            deletedKey: metaKey
        });

    } catch (error) {
        console.error("Error deleting setting:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message
        });
    }
};

module.exports = {
    saveData: saveData,
    getAllData: getAllData,
    getDataByKey:getDataByKey,
    updateDataByKey: updateDataByKey,
    deleteDataByKey: deleteDataByKey
}