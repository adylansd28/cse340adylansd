const express = require("express")
const router = express.Router()
const utilities = require("../utilities/") // ✅ Import utilities

// Serve static assets
router.use(express.static("public")) // habilita /css, /images, /js
router.use("/images", express.static("public/images"))
router.use("/css", express.static("public/css"))
router.use("/js", express.static("public/js"))

// Intentional error route for testing 500
router.get("/cause-error", utilities.handleErrors(async (req, res) => {
  throw new Error("Intentional 500 error")
}))

module.exports = router