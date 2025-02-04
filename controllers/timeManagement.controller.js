const Validator = require('fastest-validator');
const { Op } = require("sequelize");
const models = require('../models');
const { QueryTypes } = require('sequelize');


async function timeManagement(req, res){
    try{
        const {availability_time} = req.body;

        if(!availability_time){
            return res.status(500).json({
                success: false,
                message: "Time field is required."
            });
        }
        let existingdata = await models.Time_management.findAll();

        if(existingdata.length>0){
            var availabilityTimeString = Array.isArray(availability_time) 
            ? JSON.stringify(availability_time) 
            : availability_time;
    
            var query = await models.Time_management.update(
                { availability_time: availabilityTimeString },
                { where: { id: existingdata[0].dataValues.id } } 
            );
        }else{
            var availabilityTimeString = Array.isArray(availability_time) 
            ? JSON.stringify(availability_time) 
            : availability_time;
    
            var query = await models.Time_management.create({
                availability_time: availabilityTimeString
            })
        }
        return res.status(200).json({
            success: true,
            message: "Time added successfully.",
            result: availabilityTimeString
        });
    } catch(error){
        console.log("errors",error);
        res.status(200).json({
            success: false,
            message: "Something went wrong",
            error: error
        });
    }
}

async function payment(req, res) {
    try{

    }
    catch(error){

    }

}

module.exports = {
    timeManagement: timeManagement
}