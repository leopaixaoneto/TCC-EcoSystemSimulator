var express = require("express");
var router = express.Router();

/* GET home page. */
router.post("/AddInfo/:id", function (req, res, next) {
  var id = req.params.id;
  var world = req.body;

  res.send(world);
  console.log(world);
});

module.exports = router;
