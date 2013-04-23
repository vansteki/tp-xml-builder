// create server.
var express = require('express'),
    app = express(),
    port = 406;
var mysql = require('mysql');
var builder = require('xmlbuilder');
var maxCacheAge = 86400/12;
enableCache = 'no'
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
        database : ''
    });
    return connection;
}


var db_fetchPlanData = function(username, res, msgObj) {
    var con = mysql_ini();
    con.connect();

    con.query("SELECT * FROM plan INNER JOIN userdata WHERE userdata.userid = plan.userid AND userdata.name = '" + username + "'", function(err, rows, fields) {
        if (err) throw err;
        if (rows.length == 0) {
            res.send({
                'page': 'no plan found :3'
            });
        } else {
            var root = builder.create('root',{'version': '1.0', 'encoding': 'UTF-8'});
            var xml = null;
            var item = null;
            var counter = [];
            for (var i in rows) {
                counter.push(rows[i]);
                
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
            res.writeHead(200, {'Content-Type': 'text/xml; charset=UTF-8'});
            res.end(xml);
            msgObj.count = counter.length;
            console.log(msgObj);
        }
    })
    con.end();
}

var getPlanitemDetail = function(planid, res, msgObj){
    var con = mysql_ini();
    con.connect();

    con.query("select * from planitem inner join iteminfo where planitem.spotid = iteminfo.spotid AND planitem.planid ='" + planid + "'" ,function(err, rows){
        if (err) throw err;
        if (rows.length == 0)
            res.send({'page': 'sorry :3'})
        else{
            // res.send(rows)
            var root = builder.create('root',{'version': '1.0', 'encoding': 'UTF-8'});
            var xml = null;
            var item = null;
            var counter = [];
            for (var i in rows) {
                counter.push(rows[i]);

                item = root.ele('planitem')
                item.ele('userid', {'userid':rows[i].userid}, rows[i].userid)
                item.ele('planitemid', {'planitemid':rows[i].planitemid}, rows[i].planitemid)
                item.ele('itemid', {'itemid':rows[i].itemid}, rows[i].itemid)
                item.ele('spotid', {'spotid':rows[i].spotid}, rows[i].spotid)
                item.ele('itemname', {'itemname':rows[i].itemname}, rows[i].itemname)
                item.ele('infocontent', {'infocontent':rows[i].infocontent}, rows[i].infocontent)
                item.ele('item_start_time', {'item_start_time':rows[i].item_start_time}, rows[i].item_start_time)
                item.ele('item_end_time', {'item_end_time':rows[i].item_end_time}, rows[i].item_end_time)
                item.ele('queue', {'queue':rows[i].queue}, rows[i].queue)
                item.ele('day', {'day':rows[i].day}, rows[i].day)
                item.ele('lat', {'lat':rows[i].lat}, rows[i].lat)
                item.ele('lng', {'lng':rows[i].lng}, rows[i].lng)
                item.ele('flag_food', {'flag_food':rows[i].flag_food}, rows[i].flag_food)
                item.ele('flag_hotel', {'flag_hotel':rows[i].flag_hotel}, rows[i].flag_hotel)
                item.ele('flag_shopping', {'flag_shopping':rows[i].flag_shopping}, rows[i].flag_shopping)
                item.ele('flag_scene', {'flag_scene':rows[i].flag_scene}, rows[i].flag_scene)
                item.ele('flag_transport', {'flag_transport':rows[i].flag_transport}, rows[i].flag_transport)

                xml = item.ele('create_time', {'create_time':rows[i].create_time}, rows[i].create_time).end({
                    pretty: true
                });
            }
            console.log(xml);
            if(enableCache == 'yes')
                if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=' + maxCacheAge );
            res.writeHead(200, {'Content-Type': 'text/xml; charset=UTF-8'});
            res.end(xml);
            msgObj.count = counter.length;
            console.log(msgObj);
        }
 })
    con.end();
}

var check_plan_owner = function(userid, planid, res, msgObj){
    var con = mysql_ini();
    con.connect();
    con.query("SELECT * FROM plan WHERE planid ='" + planid + "'" + " AND userid ='" + userid +"'" ,function(err, rows){
        if (err) throw err;
        if (rows.length == 0)
            res.send({'page': 'not plan owner :3'})
        else
            //console.log(rows)
            getPlanitemDetail(planid, res, msgObj)
    })
    con.end();
}

var getPlanitem = function(username, planid, res, msgObj){
    var con = mysql_ini();
    con.connect();
    con.query("SELECT userid FROM userdata WHERE name = '" + username + "'", function(err, rows, fields){
        if (err) throw err;
        if (rows.length == 0)
            res.send({'page': 'no user found :3'})
        else{
            //console.log(rows)
            check_plan_owner(rows[0].userid,planid, res, msgObj)
        }
    })
    con.end();
}

app.get('/plandata/:username(\\w{3,20})', function(req, res) {
    var input = req.params.username;
    var msgObj = {'input': input }
    console.log(input)
    db_fetchPlanData(req.params.username, res, msgObj)
});


app.get('/plandata/:username(\\w{3,20})/:planid(\\d{1,4})', function(req, res) {
    var input = req.params.username + '\/' + req.params.planid
    var msgObj = {'input': input }
    getPlanitem(req.params.username, req.params.planid, res, msgObj)
});


console.log('start express server at ' + port + '\n')
