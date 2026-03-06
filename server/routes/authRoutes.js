const router = require("express").Router();
const { register, login, getProfile, updateProfile, searchAlumni, getAlumni, refreshToken } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);

// Protected routes
router.get("/me", authenticate, getProfile);          // canonical spec route
router.get("/profile", authenticate, getProfile);     // backwards-compat alias
router.patch("/profile", authenticate, updateProfile);
router.put("/profile", authenticate, updateProfile);  // backwards-compat alias

// Alumni search
router.get("/alumni/search", searchAlumni);
router.get("/alumni/:id", getAlumni);

module.exports = router;
