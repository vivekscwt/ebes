const express = require('express');
const notificationController = require('../controllers/notification.controller');
const checkAuthMiddleware = require('../middleware/check-auth');
const checkAdminMiddleware = require('../middleware/check-admin');

const router = express.Router();

router.post("/", checkAdminMiddleware.checkAdmin, notificationController.save);
router.get("/", notificationController.index);
router.patch("/:id", checkAdminMiddleware.checkAdmin, notificationController.update);
router.delete("/:id", checkAdminMiddleware.checkAdmin, notificationController.destroy);
router.get("/:user_id", notificationController.showUserNotifications);



module.exports = router;