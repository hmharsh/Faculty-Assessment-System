var express = require('express');
var assert = require('assert');
var SimpleJson2Csv = require('simple-json2csv');
var nodemailer = require('nodemailer');
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');
var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'hmharsh3@gmail.com', // Your email id
            pass: 'har$hit!^' // Your password
        }
        });

var router = express.Router();
/*var url = 'mongodb://user:user@ds053148.mlab.com:53148/pbas';*/
/* GET home page. */
var url = 'mongodb://127.0.0.1:27017/test';
router.get('/', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/home.html');
});
router.get('/table', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/table.html');
});
router.post('/updatedata', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/updatesuccess.html');
});

router.post('/resp', function(req, res, next) {
 //when user submits the form
 var mailOptions = {
 	/*var text = 'information you have provided -> name : '+req.body.name;*/
 	/*+'father : '+req.body.father+'mother : '+req.body.mother+'department : '+req.body.department+'designation : ' + req.body.designation+'pay : '+req.body.pay+'last_promo : '+req.body.last_promo+'caddress : '+req.body.caddress+'paddress : '+req.body.paddress+'telephone : '+req.body.telephone+'email : '+req.body.email+'category : '+ req.body.category ;*/
 /*	+ 'activity : ' + req.body.activity +'avg_hrs : '+req.body.avg_hrs+'api_score :'+req.body.api_score;*/
    from: 'hmharsh3@gmail.com', // sender address
    to: req.body.email, // list of receivers
    subject: 'Self-Assessment information submission', // Subject line
    text: 'information you have provided -> name : '+req.body.name+'father : '+req.body.father+'mother : '+req.body.mother+'department : '+req.body.department+'designation : ' + req.body.designation+'pay : '+req.body.pay+'last_promo : '+req.body.last_promo+'caddress : '+req.body.caddress+'paddress : '+req.body.paddress+'telephone : '+req.body.telephone+'email : '+req.body.email+'category : '+ req.body.category 	+ 'activity : ' + req.body.activity +'avg_hrs : '+req.body.avg_hrs+'api_score :'+req.body.api_score //, // plaintext body
    // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
};

// finally time to send mail
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        console.log(error);
      //  res.json({yo: 'error'});
    }else{
        console.log('Message sent: ' + info.response);
      //  res.json({yo: info.response});
    };
});

MongoClient.connect(url,function(err,db){
	assert.equal(err,null);
	var collcetion = db.collection('responce');
	collcetion.insertOne({'name':req.body.name,'father':req.body.father,'mother':req.body.mother,'department':req.body.department,'designation':req.body.designation,'pay':req.body.pay,'last_promo':req.body.last_promo,'caddress':req.body.caddress,'paddress':req.body.paddress,'telephone':req.body.telephone,'email':req.body.email,'category':req.body.category,'activity':req.body.activity,'avg_hrs':req.body.avg_hrs,'api_score':req.body.api_score},function(err,res){
		assert.equal(err,null);
			console.log('Inserted document successfully!!'+res);
			db.close();
	});
});
 res.redirect('html/success.html');
});



router.route('/html/:uid')
//delete particular field
.get(function (req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('responce');
    collcetion.deleteOne({telephone:req.params.uid}, function(err, result) {
    assert.equal(err, null);
    console.log("Removed the document of uid  "+ req.params.uid );
  });
});
 res.redirect('table.html');
});


/*
router.route('/:uid')
.get(function (req, res, next) {
//delete particular field

 res.redirect("http://localhost:3000/html/home.html?val=" + req.params.uid);
});*/


router.get('/:uid', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect("http://localhost:3000/html/update.html?val=" + req.params.uid);
});

router.get('/data/viewdata/:uid', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //console.log(req.params.uid);
 //sending data  of uid
 //res.redirect("http://localhost:3000/html/update.html?val=" + req.params.uid);
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('responce');
    collection.find({'telephone':req.params.uid}).toArray(function(err,docs){
    assert.equal(err,null);
     res.setHeader('Content-Type', 'application/json');
    res.send(docs);
    db.close();
    }); 
});




});






router.get('/data/viewdata', function(req, res, next) {
	MongoClient.connect(url,function(err,db){
	assert.equal(err,null);
	var collection = db.collection('responce');
	collection.find({}).toArray(function(err,docs){
	assert.equal(err,null);
	//console.log(docs);
	 



	 var json2Csv = new SimpleJson2Csv({
  fields: [ 
    { name: "name", header: "name" },
    { name: "father", header: "father" },
    { name: "mother", header: "mother" },
    { name: "designation", header: "designation" },
    { name: "pay", header: "pay" },
    { name: "last_promo", header: "last_promo" },
    { name: "caddress", header: "caddress" },
    { name: "telephone", header: "telephone" },
    { name: "email", header: "email" }, 
    { name: "category", header: "category" },
    { name: "activity", header: "activity" },   
    { name: "avg_hrs", header: "avg_hrs" }, 
    { name: "api_score", header: "api_score" }          

  ],
  data:  docs
    /*[{ name: "John Blue", email: "john.blue@domain.com" },
    { name: "Lab Black", email: "lab.black@domain.com" }]*/
   
  
});
json2Csv.pipe(fs.createWriteStream('public/data.csv'));
	 res.setHeader('Content-Type', 'application/json');
	 res.send(docs);
       db.close();
	});	
	
});
});





router.get('/downloaddata', function(req, res, next) {
 // res.render('index', { title: 'Express' });
var file = __dirname + '/../public/data.csv';
  res.download(file); // Set disposition and send it.

});






module.exports = router;
