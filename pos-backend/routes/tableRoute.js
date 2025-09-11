const express = require("express");
const { addTable, getTables, getTableById, updateTable, deleteTable } = require("../controllers/tableController");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification")
 
router.route("/").post(isVerifiedUser , addTable);
router.route("/").get(isVerifiedUser , getTables);
router.route("/:id").get(getTableById); // Không cần auth cho customer access
router.route("/:id").put(updateTable); // Bỏ authentication cho update table
router.route("/:id").delete(isVerifiedUser , deleteTable); // Thêm route xóa bàn

module.exports = router;