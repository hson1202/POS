const express = require("express");
const { addTable, getTables, updateTable, deleteTable } = require("../controllers/tableController");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification")
 
router.route("/").post(isVerifiedUser , addTable);
router.route("/").get(isVerifiedUser , getTables);
router.route("/:id").put(updateTable); // Bỏ authentication cho update table
router.route("/:id").delete(isVerifiedUser , deleteTable); // Thêm route xóa bàn

module.exports = router;