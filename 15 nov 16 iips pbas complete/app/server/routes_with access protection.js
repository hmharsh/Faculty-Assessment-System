
var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
var express = require('express');
var assert = require('assert');
var SimpleJson2Csv = require('simple-json2csv');
var nodemailer = require('nodemailer');
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');
var url = 'mongodb://127.0.0.1:27017/test';
var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'hmharsh3@gmail.com', // Your email id
            pass: 'har$hit!^' // Your password
        }
        });

module.exports = function(app) {

// main login page //
var checkuser = function(req,res,next){
	if(req.session.user)
	{
		console.log(req.session.user.name);
			next();
	}
	else
	{
		res.send("you are not authorized")
	}
}
var checkadmin = function(req,res,next){
if(req.session.user){


	if(req.session.user.name='hmharsh3')
	{
		console.log(req.session.user.name);
			next();
	}
	else
	{
		
	}
}
else
{
	res.send("you are not authorized")
}
};


	app.get('/', function(req, res){
	// check if the user's credentials are saved in a cookie //
	
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		}	else{
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
		console.log('0'+o);
				    req.session.user = o;
					res.redirect('/home');
				}	else{
					res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});
	
	app.post('/',checkadmin, function(req, res){
		AM.manualLogin(req.body['user'], req.body['pass'], function(e, o){
			if (!o){
				res.status(400).send(e);
			}	else{
				

					req.session.user = o;
			
				if (req.body['remember-me'] == 'true'){
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.status(200).send(o);
			}
		});
	});
	
// logged-in user homepage //
	
	app.get('/home',function(req,res){


		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}	else{
			res.writeHead(200, {'Content-Type': 'text/html'});
            fs.createReadStream('public/html/menu.html').pipe(res);
			}
		


		  
	});
	app.get('/main', function(req, res) {
		console.log(req.session.user)
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}	else{
			res.render('home', {
				title : 'Control Panel',
				countries : CT,
				udata : req.session.user
			});
		}
	});
	
	app.post('/home',checkuser, function(req, res){

		if (req.session.user == null){
			res.redirect('/');
		}	else{
			AM.updateAccount({
				id		: req.session.user._id,
				name	: req.body['name'],
				email	: req.body['email'],
				pass	: req.body['pass'],
				/*country	: req.body['country']*/
			}, function(e, o){
				if (e){
					res.status(400).send('error-updating-account');
				}	else{
					console.log('2'+o);
				

					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.status(200).send('ok');
				}
			});
		}
	});

	app.post('/logout', function(req, res){
		res.clearCookie('user');
		res.clearCookie('pass');
		req.session.destroy(function(e){ res.redirect('/home'); });
		console.log("Logout success");
		
	});





	app.get('/logout', function(req, res){

		res.redirect('/home');
	});
	


	
// creating new accounts //
	
	app.get('/adduser',checkadmin, function(req, res) {
		res.render('signup', {  title: 'Add new user', countries : CT });
	});
	
	app.post('/signup', function(req, res){
		AM.addNewAccount({
			name 	: req.body['name'],
			//email 	: req.body['email'],
			user 	: req.body['user'],
			pass	: req.body['pass'],
			
		}, function(e){
			if (e){
				res.status(400).send(e);
			}	else{
				res.status(200).send('ok');
			}
		});
	});

// password reset //

	app.post('/lost-password',checkuser, function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.body['email'], function(o){
			if (o){
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// TODO add an ajax loader to give user feedback //
					if (!e){
						res.status(200).send('ok');
					}	else{
						for (k in e) console.log('ERROR : ', k, e[k]);
						res.status(400).send('unable to dispatch password reset');
					}
				});
			}	else{
				res.status(400).send('email-not-found');
			}
		});
	});

	app.get('/reset-password',checkuser, function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});
	
	app.post('/reset-password',checkuser, function(req, res) {
		var nPass = req.body['pass'];
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.status(200).send('ok');
			}	else{
				res.status(400).send('unable to update password');
			}
		})
	});
	
// view & delete accounts //
	
	app.get('/print',checkadmin ,function(req, res) {
		AM.getAllRecords( function(e, accounts){
			res.render('print', { title : 'Account List', accts : accounts });
		})
	});
	
	app.post('/delete',checkadmin ,function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
				req.session.destroy(function(e){ res.status(200).send('ok'); });
			}	else{
				res.status(400).send('record not found');
			}
	    });
	});
	
	app.get('/reset',checkadmin, function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');	
		});
	});
	
	


//coping routs from iips project




































app.get('/homee',checkuser, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 console.log('req. for home page');

 res.redirect('html/home.html');
});
app.get('/cattwo',checkuser, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/cattwo.html');
});
app.get('/catthree',checkuser, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthree.html');
});
app.get('/table',checkadmin, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/table.html');
});
app.get('/tablecattwo',checkuser, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/tablecattwo.html');
});
app.get('/catthreeone',checkuser, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthreeone.html');
});
app.get('/catthreetwo',checkuser, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthreetwo.html');
});
app.get('/catthreethree',checkuser, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthreethree.html');
});
app.get('/catthreefour',checkuser, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthreefour.html');
});
app.get('/catthreefive',checkuser, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthreefive.html');
});
app.get('/catthreesix',checkuser, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthreesix.html');
});
app.get('/catthreeseven',checkuser, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthreeseven.html');
});

app.post('/updatedata',checkuser, function(req, res, next) {
 // res.render('index', { title: 'Express' });




MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('responce');
    console.log(req.body)
  collection.updateOne ({'username':req.body.userid}
    , { $set: {'name':req.body.name,'father':req.body.father,'mother':req.body.mother,'department':req.body.department,'designation':req.body.designation,'pay':req.body.pay,'last_promo':req.body.last_promo,'caddress':req.body.caddress,'paddress':req.body.paddress,'telephone':req.body.telephone,'email':req.body.email} }, null, function(err, result) {

    assert.equal(err, null);
    console.log("Updated the document ");
  
  });
});

 res.redirect('html/updatesuccess.html');
});
app.post('/respcattwo',checkuser, function(req, res, next) {
    MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('rescattwo');
    collcetion.insertOne({'category':req.body.category,'activity':req.body.activity,'duration_type':req.body.duration_type,'duration':req.body.duration,'api_score':req.body.api_score},function(err,res){
        assert.equal(err,null);
            console.log('Inserted document successfully!!'+res);
            db.close();
    });
});
 res.redirect('html/success.html');
});
//post req from category 3 form
app.post('/catthreeone',checkuser, function(req, res, next) {
    MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('catthreeone');
    collcetion.insertOne({'category':req.body.category,'title':req.body.title,'issn_isbn':req.body.issn_isbn,'total_Coauthors':req.body.total_Coauthors,'peer_reviewed':req.body.peer_reviewed,'main_author':req.body.main_author,'api_score':req.body.api_score},function(err,res){
        assert.equal(err,null);
            console.log('Inserted document successfully!!'+res);
            db.close();
    });
  });
  res.redirect('html/catthreeone.html');
});

app.post('/catthreetwo',checkuser, function(req, res, next) {
    MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('catthreetwo');
    collcetion.insertOne({'title':req.body.title,'issn_isbn':req.body.issn_isbn,'Conference_publication':req.body.Conference_publication,'total_Coauthors':req.body.total_Coauthors,'main_author':req.body.main_author,'api_score':req.body.api_score},function(err,res){
        assert.equal(err,null);
            console.log('Inserted document successfully!!'+res);
            db.close();
    });
  });
  res.redirect('html/catthreetwo.html');
});

app.post('/catthreethree',checkuser, function(req, res, next) {
    MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('catthreethree');
    collcetion.insertOne({'title':req.body.title,'issn_isbn':req.body.issn_isbn,'book_type_and_authorship':req.body.book_type_and_authorship,'peer_reviewed':req.body.peer_reviewed,'total_Coauthors':req.body.total_Coauthors,'main_author':req.body.main_author,'api_score':req.body.api_score},function(err,res){
        assert.equal(err,null);
            console.log('Inserted document successfully!!'+res);
            db.close();
    });
  });
  res.redirect('html/catthreethree.html');
});



app.post('/catthreefour',checkuser, function(req, res, next) {
    MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('catthreefour');
    collcetion.insertOne({'title':req.body.title,'Agency':req.body.Agency,'grant_in_lakh':req.body.grant_in_lakh,'duration_type':req.body.duration_type,'duration':req.body.duration,'api_score':req.body.api_score},function(err,res){
        assert.equal(err,null);
            console.log('Inserted document successfully!!'+res);
            db.close();
    });
  });
  res.redirect('html/catthreefour.html');
});


app.post('/catthreefive',checkuser, function(req, res, next) {
    MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('catthreefive');
    collcetion.insertOne({'degree':req.body.degree,'Number_Enrolled':req.body.Number_Enrolled,'Thesis_Submitted':req.body.Thesis_Submitted,'Degree_awarded':req.body.Degree_awarded,'api_score':req.body.api_score},function(err,res){
        assert.equal(err,null);
            console.log('Inserted document successfully!!'+res);
            db.close();
    });
  });
  res.redirect('html/catthreefive.html');
});

app.post('/catthreesix',checkuser, function(req, res, next) {
    MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('catthreesix');
    collcetion.insertOne({'program':req.body.program,'duration_type':req.body.duration_type,'Duration':req.body.Duration,'Organized_by':req.body.Organized_by,'api_score':req.body.api_score},function(err,res){
        assert.equal(err,null);
            console.log('Inserted document successfully!!'+res);
            db.close();
    });
  });
  res.redirect('html/catthreesix.html');
});



app.post('/catthreeseven',checkuser, function(req, res, next) {
    MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('catthreeseven');
    collcetion.insertOne({'category':req.body.category,'title':req.body.title,'Title_of_Conference_Seminar':req.body.Title_of_Conference_Seminar,'date_event':req.body.date_event,'Organised_by':req.body.Organised_by,'Whether_Internation_National_State':req.body.Whether_Internation_National_State,'api_score':req.body.api_score},function(err,res){
        assert.equal(err,null);
            console.log('Inserted document successfully!!'+res);
            db.close();
    });
  });
  res.redirect('html/catthreeseven.html');
});






















app.post('/checkuid',checkuser, function(req, res, next) {
  //res.body.uid;
 /* console.log(req.body.tel)*/
  MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('responce');
    collection.find({'username':req.body.uid}).toArray(function(err,docs){
    assert.equal(err,null);
    if(docs.length == 0){
       console.log(docs); 


MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('responce');
  collection.updateOne ({'telephone':req.body.tel}
    , { $set: {'username':req.body.uid} }, null, function(err, result) {

    assert.equal(err, null);
    console.log("Updated the document ");
  
  });
});













       res.redirect('html/success.html');
    }
    else
    {
        console.log('uid already present');
        res.redirect('html/uid.html?try=yes');

    }

    
    db.close();
    }); 
});

    
});

app.post('/resp',checkuser, function(req, res, next) {
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
	collcetion.insertOne({'username':'default','name':req.body.name,'father':req.body.father,'mother':req.body.mother,'department':req.body.department,'designation':req.body.designation,'pay':req.body.pay,'last_promo':req.body.last_promo,'caddress':req.body.caddress,'paddress':req.body.paddress,'telephone':req.body.telephone,'email':req.body.email},function(err,res){
		assert.equal(err,null);
			console.log('Inserted document successfully!!'+res);
			db.close();
	});
});
 res.redirect('html/uid.html?try='+req.body.telephone);
});



app.route('/html/:uid')
//delete particular field
.get(checkuser,function (req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('responce');
    collcetion.deleteOne({telephone:req.params.uid}, function(err, result) {
    assert.equal(err, null);
    console.log("Removed the document of uid  "+ req.params.uid );
  });
});
 res.redirect('html/table.html');
});


/*
app.route('/:uid')
.get(function (req, res, next) {
//delete particular field

 res.redirect("http://localhost:3000/html/home.html?val=" + req.params.uid);
});*/




//add access protection from here

app.get('/:uid', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect("html/update.html?val=" + req.params.uid);
});

app.get('/data/viewdatacattwo', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('rescattwo');
    collection.find({}).toArray(function(err,docs){
    assert.equal(err,null);
    //console.log(docs);
     



     var json2Csv = new SimpleJson2Csv({
  fields: [ 
    { name: "category", header: "category" },
    { name: "activity", header: "activity" },
    { name: "duration_type", header: "duration_type" },
    { name: "duration", header: "duration" },
    { name: "api_score", header: "api_score" },
      

  ],
  data:  docs
    /*[{ name: "John Blue", email: "john.blue@domain.com" },
    { name: "Lab Black", email: "lab.black@domain.com" }]*/
   
  
});
json2Csv.pipe(fs.createWriteStream('datacattwo.csv'));
     res.setHeader('Content-Type', 'application/json');
     res.send(docs);
       db.close();
    }); 
    
});

});
app.get('/data/viewdatacattwo/:uid', function(req, res, next) {

});

app.get('/data/viewdata/:uid', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //console.log(req.params.uid);
 //sending data  of uid
 //res.redirect("http://localhost:3000/html/update.html?val=" + req.params.uid);
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('responce');
    collection.find({'username':req.params.uid}).toArray(function(err,docs){
    assert.equal(err,null);
     res.setHeader('Content-Type', 'application/json');
    res.send(docs);
    db.close();
    }); 
});




});






app.get('/data/viewdata', function(req, res, next) {
	MongoClient.connect(url,function(err,db){
	assert.equal(err,null);
	var collection = db.collection('responce');
	collection.find({}).toArray(function(err,docs){
	assert.equal(err,null);
	//console.log(docs);
	 



	 var json2Csv = new SimpleJson2Csv({
  fields: [ 
    { name: "username", header: "username" },
    { name: "name", header: "name" },
    { name: "father", header: "father" },
    { name: "mother", header: "mother" },
    { name: "department", header: "department" },
    { name: "designation", header: "designation" },
    { name: "pay", header: "pay" },
    { name: "last_promo", header: "last_promo" },
    { name: "caddress", header: "caddress" },
    { name: "paddress", header: "paddress" },
    { name: "telephone", header: "telephone" },
    { name: "email", header: "email" }, 
         

  ],
  data:  docs
    /*[{ name: "John Blue", email: "john.blue@domain.com" },
    { name: "Lab Black", email: "lab.black@domain.com" }]*/
   
  
});
json2Csv.pipe(fs.createWriteStream('data.csv'));
	 res.setHeader('Content-Type', 'application/json');
	 res.send(docs);
       db.close();
	});	
	
});
});





app.get('/downloaddata',checkadmin, function(req, res, next) {
 // res.render('index', { title: 'Express' });
var file = __dirname + '/../public/data.csv';
  res.download(file); // Set disposition and send it.

});

app.get('html/cattwodownload',checkadmin, function(req, res, next) {
 // res.render('index', { title: 'Express' });
var file = __dirname + '/../public/datacattwo.csv';
  res.download(file); // Set disposition and send it.

});








































//app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });


//copied portion up to here

};
