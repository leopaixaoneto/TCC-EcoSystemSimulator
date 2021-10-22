const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
    // let sql = `SELECT * FROM log_servidor`;
    // db.query(sql, function(err, data, fields) {
    //   if (err) throw err;
    //   res.json({
    //     status: 200,
    //     data,
    //     message: "Animal lists retrieved successfully"
    //   })
    // })

    res.json({
      status: 200,
      message: "Animal lists retrieved successfully"
    });
  });

router.post('/World' , function(req, res){
    let query = `INSERT INTO entity_data (type,worldBirthDate,worldTime,perception,maxSpeed,lightSensibility,maxForce) VALUES `

    let test = Object.keys(req.body);
    world = JSON.parse(req.body)

    req.body.entities.forEach(element => {
      query += `("${element.type}","${req.body.world.birthDate}","${req.body.world.actualTime}",${element.perception},${element.maxSpeed},${element.lightSensibility}, ${element.maxForce}),`
    });


    query = query.slice(0, -1) + ";"

    let values = [
        req.body.nome,
        req.body.tipo
    ];

    db.query(query, [values], function(err, data, fields) {
      if (err) throw err;
      res.json({
        status: 200,
        message: "Data Saved Sucessful"
      })
    })
});

module.exports = router;
