var express = require('express');
var Protocol = require('azure-iot-device-amqp').Amqp;
var Client = require('azure-iot-device').Client;
var FitbitClient = require("fitbit-node");
var Message = require('azure-iot-device').Message;
var ConnectionString = require('azure-iot-device').ConnectionString;
var app = express();

var client = new FitbitClient("xxxxxxx", "");
var redirect_uri = 'http://localhost:3000/cback';
var scope = 'activity nutrition profile sleep settings social weight';
var connectionString = 'HostName=srramiothub.azure-devices.net;DeviceId=Wearables;SharedAccessKey=+=';
var deviceId = ConnectionString.parse(connectionString).DeviceId;
var iotclient = Client.fromConnectionString(connectionString, Protocol);


app.get("/authorize", function (req, res) {
    res.redirect(client.getAuthorizeUrl(scope, redirect_uri));

});

app.get("/cback", function (req, res) {
    console.log(req.query.code);

    client.getAccessToken(req.query.code, redirect_uri).then(function (result) {

        console.log( client.get("/activities/date/2016-11-02.json", result.access_token));
        client.get("/activities/date/2016-11-02.json", result.access_token).then(function (results) {

            var readings = results[0];
            readings.currentTime = new Date();
            var message = new Message(JSON.stringify(readings));
            console.log('printing json results ::', readings);
            res.send(results[0]);
            iotclient.open(function (error, result) {
                if (error) {
                    console.log("Connectivity error: %s...", error);
                    return;
                }

                iotclient.sendEvent(message, function (error) {
                    if (error) {
                        console.log(error.toString());
                    }
                    else {
                        console.log("Data sent on %s...", readings.currentTime);
                    }
                });

            });

        });
    }).catch(function (error) {
        res.send(error);
    });
});


app.listen(3000);






