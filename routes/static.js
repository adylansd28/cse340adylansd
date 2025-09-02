const express = require("express")
const router = express.Router()

router.use(express.static("public"))         // habilita /css, /images, /js
router.use("/images", express.static("public/images"))
router.use("/css", express.static("public/css"))
router.use("/js", express.static("public/js"))

module.exports = router



