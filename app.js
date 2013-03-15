// create server.
var express = require('express'),
    app = express(),
    port = 407;
var mysql = require('mysql');
var builder = require('xmlbuilder');
var maxCacheAge = 86400/12;
enableCache = 'yes'
app.listen(port);

// var allowCrossDomain = function(req, res, next) {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET');
//     res.header('Access-Control-Allow-Headers', 'Content-Type');
//     next();
// }

// app.configure(function() {
//   app.use(allowCrossDomain);
// });

var mysql_ini = function() {
    var connection = mysql.createConnection({
        host: '',
        user: '',
        password: '',
    });
    return connection;
}

var db_fetchPlanData = function(username, res, msgObj) {
    var con = mysql_ini();
    var items = [];

    con.connect();
    con.query('use tp');
    con.query("SELECT * FROM plan INNER JOIN userdata WHERE userdata.userid = plan.userid AND userdata.name = '" + username + "'", function(err, rows, fields) {
        if (err) throw err;
        if (rows.length == 0) {
            res.send({
                'page': 'no plan found :3'
            });
        } else {

            var root = builder.create('root');
            var xml = null;
            for (var i in rows) {
                items.push(rows[i]);
                console.log('> ',
                rows[i].planid + ' ' + rows[i].planname + ' ' + rows[i].name + ' ' + rows[i].userid + ' ' + rows[i].total_days + ' ' + rows[i].plan_start_date + ' ' + rows[i].plan_end_date);

                item = root.ele('plan');
                item.ele('planid', {'planid':rows[i].planid}, rows[i].planid);
                item.ele('name', {'name':rows[i].planname}, rows[i].planname);
                item.ele('days', {'days':rows[i].total_days}, rows[i].total_days);
                item.ele('start', {'start':rows[i].plan_start_date}, rows[i].plan_start_date);
                xml = item.ele('end', {'end':rows[i].plan_end_date}, rows[i].plan_end_date).end({
                    pretty: true
                });
            }

            console.log(xml);
            if(enableCache == 'yes')
                if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=' + maxCacheAge );
            res.writeHead(200);
            res.end(xml);
            msgObj.count = items.length;
            console.log(msgObj);
        }
    })
    con.end();
}

app.get('/plandata/:username(\\w{3,20})', function(req, res) {
    var input = req.params.username;
    var msgObj = {'input': req.params.username };
    console.log(input);
    db_fetchPlanData(req.params.username, res, msgObj);
});

console.log('start express server at ' + port + '\n');