const Validator = require('fastest-validator');
const { Op } = require("sequelize");
const models = require('../models');
const { QueryTypes } = require('sequelize');


async function timeManagement(req, res){
    try{
        const {times} = req.body;
        // var query = await models.time

    } catch(error){
        res.status(200).json({
            success: false,
            message: "Something went wrong",
            error: error
        });
    }
}