const express = require('express');
const timeManagementController = require('../controllers/timeManagementRoutes.controller')
const router = express.Router();

router.get("/time-management/", timeManagementController.timeManagement)

module.exports = router;