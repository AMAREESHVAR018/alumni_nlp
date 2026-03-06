const router = require("express").Router();
const { searchAlumni, getAlumni } = require("../controllers/authController");

// GET /api/alumni/search?q=&domain=&company=&skills=&page=&limit=
router.get("/search", searchAlumni);

// GET /api/alumni/:id
router.get("/:id", getAlumni);

module.exports = router;
