const router = require("express").Router();
const { register, login, getProfile, updateProfile, searchAlumni, getAlumni } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);

// Alumni search
router.get("/alumni/search", searchAlumni);
router.get("/alumni/:id", getAlumni);

module.exports = router;
