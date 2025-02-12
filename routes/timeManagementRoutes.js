const express = require('express');
const checkAuthMiddleware = require('../middleware/check-auth');
const checkAdminMiddleware = require('../middleware/check-admin');
const timeManagementController = require('../controllers/timeManagement.controller')

const router = express.Router();

router.post("/time-management", checkAdminMiddleware.checkAdmin, timeManagementController.timeManagement);

router.get("/get-pickup-time", timeManagementController.GetPickupTime);

module.exports = router;