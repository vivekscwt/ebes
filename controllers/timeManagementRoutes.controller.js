const Validator = require('fastest-validator');
const { Op } = require("sequelize");
const models = require('../models');
const { QueryTypes } = require('sequelize');


async function timeManagement(req, res){
    try{
        const {times} = req.body;
        var query = await models.Time_management.create({
            times: times
        })
        return res.status(201).json({
            success: true,
            message: "Time added successfully.",
            result: times
          });

    } catch(error){
        res.status(200).json({
            success: false,
            message: "Something went wrong",
            error: error
        });
    }
}

module.exports = {
    timeManagement: timeManagement
}