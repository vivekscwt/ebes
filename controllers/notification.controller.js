const Validator = require('fastest-validator');
const { Op } = require("sequelize");
const models = require('../models');
const { QueryTypes } = require('sequelize');

async function save(req, res) {
    const notification = {
        type: req.body.type,
        message_body: req.body.message_body,
        user_id: req.body.user_id || null,
        order_id: req.body.order_id || null
    }

    const schema = {
        type: { type: "string", optional: false },
        message_body: { type: "string", optional: false, max: "500" },
        user_id: { type: "number", optional: true, integer: true },
        order_id: { type: "number", optional: true, integer: true }
    };

    const v = new Validator();
    const validationResponse = v.validate(notification, schema);

    if (validationResponse !== true) {
        return res.status(400).json({
            message: "Validation failed",
            errors: validationResponse
        });
    }
    

    try {
        const result = await models.Notification.create(notification);
        return res.status(201).json({  // 201 for resource creation
            success: true,
            message: "Notification created successfully",
            result: result
        });
    } catch (error) {
        console.error('Notification creation error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to create notification",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }

}

function show(req, res) {
    const id = req.params.id;

    models.Product.findByPk(id, {
        include: [
            {
                model: models.ProductCategory,
                attributes: ['id', 'categoryName'], 
                through: { attributes: [] } 
            },
            {
                model: models.Admin, 
                attributes: ['id', 'fname', 'lname', 'email']
            }
        ]
        // include: [models.ProductCategory, models.User]
    }).then(result => {
        if (result) {
            let responseData = result.toJSON();
            responseData.User = responseData.Admin;
            delete responseData.Admin;

            res.status(200).json({
                success: true,
                message: "Product fetched successfully.",
                result: responseData
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Product not found!"
            })
        }
    }).catch(error => {
        res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message,
        })
    });
}

function index(req, res) {
    models.Notification.findAll({
        where: {
            type: "public"
        },
        order: [['createdAt', 'DESC']] // Orders by latest created product first
    })
    .then(result => {
        res.status(200).json({
            success: true,
            message: "Notifications fetched successfully.",
            result: result
        });
    })
    .catch(error => {
        res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message
        });
    });
}

/**
 * Function to update a Notification
 */
async function update(req, res) {
    const id = req.params.id;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
            success: false,
            message: "Invalid notification ID"
        });
    }

    const updatedFields = {
        message_body: req.body.message_body,
        // Include other fields if needed
        updatedAt: new Date() // Explicitly set updatedAt
    };

    // Validation schema
    const schema = {
        message_body: { 
            type: "string", 
            optional: false, 
            max: 500,
            custom: (v) => v.trim().length > 0,
            messages: {
                custom: "Message body cannot be empty"
            }
        }
    };

    // Validate input
    const v = new Validator();
    const validationResponse = v.validate(updatedFields, schema);

    if (validationResponse !== true) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: validationResponse
        });
    }

    try {
        // Update directly without separate find operation
        const [affectedCount, affectedRows] = await models.Notification.update(updatedFields, {
            where: { id },
            // For MySQL/MariaDB (no RETURNING support)
            silent: true // Prevents hook issues
        });

        if (affectedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        // Fetch the updated notification
        const updatedNotification = await models.Notification.findByPk(id);

        return res.status(200).json({
            success: true,
            message: "Notification updated successfully",
            result: updatedNotification
        });

    } catch (error) {
        console.error('Update notification error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to update notification",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

async function destroy(req, res) {
    const id = req.params.id;

    // Validate ID
    if (!id || isNaN(Number(id))) {
        return res.status(400).json({
            success: false,
            message: "Invalid notification ID"
        });
    }

    try {
        // Perform permanent delete
        const deletedCount = await models.Notification.destroy({
            where: { id },
            force: true // Ensures permanent delete even if paranoid mode is enabled
        });

        if (deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification permanently deleted successfully"
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete notification",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

/**
 * Function to show notifications for a specific user
 */

async function showUserNotifications(req, res) {
    const userId = req.params.user_id;

    // Validate user ID
    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
    }

    try {
        // Check if user exists
        const user = await models.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Fetch both private (user-specific) AND public notifications
        const notifications = await models.Notification.findAll({
            where: {
                [Op.or]: [
                    { user_id: userId, type: "private" },  // User's private notifications
                    { type: "public" }                      // All public notifications
                ]
            },
            order: [['createdAt', 'DESC']]  // Newest first
        });

        return res.status(200).json({
            success: true,
            message: notifications.length > 0 
                ? "Notifications fetched successfully" 
                : "No notifications available",
            count: notifications.length,
            data: notifications
        });

    } catch (error) {
        console.error('Fetch notifications error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}


module.exports = {
    save: save,
    show: show,
    index: index,
    update: update,
    destroy: destroy,
    showUserNotifications: showUserNotifications
}