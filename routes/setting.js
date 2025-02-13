const express = require('express');
const settingController = require('../controllers/setting.controller');
const checkAuthMiddleware = require('../middleware/check-auth');
const checkAdminMiddleware = require('../middleware/check-admin');

const router = express.Router();

router.post("/", checkAdminMiddleware.checkAdmin, settingController.saveData);
router.get("/get-all", settingController.getAllData);
router.get("/get-by-key", settingController.getDataByKey);
router.patch("/", checkAdminMiddleware.checkAdmin, settingController.updateDataByKey);
router.delete("/", checkAdminMiddleware.checkAdmin, settingController.deleteDataByKey);


module.exports = router;