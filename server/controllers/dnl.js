const jwt = require('jsonwebtoken'),
      crypto = require('crypto'),
      validator = require('validator'),
      config = require('config'),
      User = require('../models/user'),
      status = require('../status'),
      Gamedig = require('gamedig');


exports.getServerData = (req, res, next) => {
  Gamedig.query({
      type: 'arkse',
      host: '173.212.225.7',
      port: '27015',
  }).then((state) => {
      res.status(200).send({message: "Server is online", serverState: state});
  }).catch((error) => {
    if (error && error == "UDP Watchdog Timeout") {
      res.status(200).send({message: "DNL server timed out", timeout: true });
      return;
    }
    console.log('DNL server error: ', error);
    res.status(200).send({message: "Server is offline", offline: true });
  });
};
