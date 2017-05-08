
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
global.name = "yash"
global.updatecattwoid = "default_cattwo_update_id";
global.updatecattwoid = "default_catthreetwo_update_id";
global.updatecatthreeoneid = "default_catthreeone_update_id";
global.updatecatthreetwoid = "default_catthreetwo_update_id";
global.updatecatthreethreeid = "default_catthreethree_update_id";
global.updatecatthreefourid = "default_catthreefour_update_id";
global.updatecatthreefiveid = "default_catthreefive_update_id";
global.updatecatthreesixid = "default_catthreesix_update_id";
global.updatecatthreesevenid = "default_catthreeseven_update_id";
// a global variable contain cunnently loggeg in user name 
module.exports = function(app) {


var checkuser = function(req,res,next){

	if(req.session.user)
	{
		
			next();
	}
	else
	{
		res.send("you are not authonticated")
	}
}
var checkadmin = function(req,res,next){
if(req.session.user){


	if(req.session.user.user==='hmharsh3')
	{//also change admin user information(username) at " get-'/' " ,where used to redirect either on admin menu by admin account or on simple menu.html for odinary user
		//also change in get - > '/home'
		next();
	}
	else
	{

	   res.send("You are not authorized , you need Admintrative account to access this information")
	}
}else
{
	res.send("you are not authorized")
}
};



  app.get('/mainmenu',function(req,res){
			
            global.name = req.session.user.user;

                   //console.log(req.session.user);
				    if(req.session.user.user==="hmharsh3"){
							     	
							     	res.redirect('/adminmenu');
				     }
				     else{
				
           				 res.redirect('html/menu.html');
				         }
	});


    app.get('/adminmenu',checkadmin,function(req,res){
			res.writeHead(200, {'Content-Type': 'text/html'});
            fs.createReadStream('public/html/adminmenu.html').pipe(res);	  
	});
	app.get('/catthreeadmin',checkadmin,function(req,res){
			res.writeHead(200, {'Content-Type': 'text/html'});
            fs.createReadStream('public/html/catthreeadmin.html').pipe(res);	  
	});
	
	
	app.get('/print', function(req, res) {
/*		AM.getAllRecords( function(e, accounts){
			res.render('print', { title : 'Account List', accts : accounts });
		})*/
res.redirect("html/print.html");

	});
	













	app.get('/', function(req, res){
	// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		}	else{
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
				    req.session.user = o;
					res.redirect('/home');
				}	else{
					res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});
	
	app.post('/', function(req, res){
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
	
	app.get('/home', function(req, res) {
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
	
	app.post('/home', function(req, res){
		if (req.session.user == null){
			res.redirect('/');
		}	else{
			AM.updateAccount({
				id		: req.session.user._id,
				name	: req.body['name'],
				email	: req.body['email'],
				pass	: req.body['pass'],
				country	: req.body['country']
			}, function(e, o){
				if (e){
					res.status(400).send('error-updating-account');
				}	else{
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					  res.redirect('html/menu.html'); 
				}
			});
		}
	});

	app.post('/logout', function(req, res){
		res.clearCookie('user');
		res.clearCookie('pass');
		req.session.destroy(function(e){ res.redirect('/'); });
	})
	
// creating new accounts //
	
	app.get('/signup',checkadmin, function(req, res) {
		res.render('signup', {  title: 'Add User', countries : CT });
	});
	
	app.post('/signup', function(req, res){
		AM.addNewAccount({
			name 	: req.body['name'],
			email 	: req.body['email'],
			user 	: req.body['user'],
			pass	: req.body['pass'],
			country : req.body['country']
		}, function(e){
			if (e){
				res.status(400).send(e);
			}	else{
				res.status(200).send('ok');
			}
		});
	});

// password reset //

	app.post('/lost-password', function(req, res){
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

	app.get('/reset-password', function(req, res) {
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
	
	app.post('/reset-password', function(req, res) {
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
	

	
	app.post('/delete', function(req, res){
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
	
	app.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');	
		});
	});














app.get('/downloadcatthreetwo', function(req, res, next) {
/*var file = __dirname + '/../../public/data.csv';*/ //for file inside public folder
var file = __dirname + '/../../datacatthreetwo.csv';
  res.download(file); // Set disposition and send it.

});

app.get('/downloadcatthreethree', function(req, res, next) {
/*var file = __dirname + '/../../public/data.csv';*/ //for file inside public folder
var file = __dirname + '/../../datacatthreethree.csv';
  res.download(file); // Set disposition and send it.

});
app.get('/downloadcatthreefour', function(req, res, next) {
/*var file = __dirname + '/../../public/data.csv';*/ //for file inside public folder
var file = __dirname + '/../../datacatthreefour.csv';
  res.download(file); // Set disposition and send it.

});
app.get('/downloadcatthreefive', function(req, res, next) {
/*var file = __dirname + '/../../public/data.csv';*/ //for file inside public folder
var file = __dirname + '/../../datacatthreefive.csv';
  res.download(file); // Set disposition and send it.

});
app.get('/downloadcatthreesix', function(req, res, next) {
/*var file = __dirname + '/../../public/data.csv';*/ //for file inside public folder
var file = __dirname + '/../../datacatthreesix.csv';
  res.download(file); // Set disposition and send it.

});
app.get('/downloadcatthreeseven', function(req, res, next) {
/*var file = __dirname + '/../../public/data.csv';*/ //for file inside public folder
var file = __dirname + '/../../datacatthreeseven.csv';
  res.download(file); // Set disposition and send it.

});




















app.get('/genupdate', function(req, res, next) {
 //res.render('index', { title: 'Express' });
 //console.log('req. for home page');
 res.redirect('html/update.html?val='+global.name);

});
app.get('/downloadgenral', function(req, res, next) {
/*var file = __dirname + '/../../public/data.csv';*/ //for file inside public folder
var file = __dirname + '/../../data.csv';
  res.download(file); // Set disposition and send it.

});
app.get('/downloadcattwo', function(req, res, next) {
/*var file = __dirname + '/../../public/data.csv';*/ //for file inside public folder
var file = __dirname + '/../../datacattwo.csv';
  res.download(file); // Set disposition and send it.

});
app.get('/downloadcatthreetable', function(req, res, next) {
/*var file = __dirname + '/../../public/data.csv';*/ //for file inside public folder
var file = __dirname + '/../../datacatthreeone.csv';
  res.download(file); // Set disposition and send it.
 // console.log("working!!");

});

app.get('/homee', function(req, res, next) {
 //res.render('index', { title: 'Express' });
 //console.log('req. for home page');
 res.redirect('html/home.html');
});
app.get('/addsession', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/addsession.html');
});
app.get('/viewallsession', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/viewallsession.html');
});
app.get('/cattwo', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/cattwo.html');
});
app.get('/catthree', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthree.html');
});
app.get('/table',checkadmin, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/table.html');
});
app.get('/tablecattwo',checkadmin,function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/tablecattwo.html');
});
app.get('/tablecatthreeone',checkadmin, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/tablecatthreeone.html');
});
app.get('/tablecatthreetwo',checkadmin, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/tablecatthreetwo.html');
});
app.get('/tablecatthreethree',checkadmin, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/tablecatthreethree.html');
});
app.get('/tablecatthreefour',checkadmin, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/tablecatthreefour.html');
});
app.get('/tablecatthreefive',checkadmin, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/tablecatthreefive.html');
});
app.get('/tablecatthreesix',checkadmin, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/tablecatthreesix.html');
});
app.get('/tablecatthreeseven',checkadmin, function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/tablecatthreeseven.html');
});










app.get('/catthreeone', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthreeone.html');
});
app.get('/catthreetwo', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthreetwo.html');
});
app.get('/catthreethree', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthreethree.html');
});
app.get('/catthreefour', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthreefour.html');
});
app.get('/catthreefive', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthreefive.html');
});
app.get('/catthreesix', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthreesix.html');
});
app.get('/catthreeseven', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect('html/catthreeseven.html');
});

app.post('/updatedata', function(req, res, next) {
 // res.render('index', { title: 'Express' });
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('responce');
   // console.log(req.body)
  collection.updateOne ({'username':req.body.userid}
    , { $set: {'name':req.body.name,'father':req.body.father,'mother':req.body.mother,'department':req.body.department,'designation':req.body.designation,'pay':req.body.pay,'last_promo':req.body.last_promo,'caddress':req.body.caddress,'paddress':req.body.paddress,'telephone':req.body.telephone,'email':req.body.email} }, null, function(err, result) {
//removed (from above line) :- 'session':req.body.session,
    assert.equal(err, null);
    console.log("Updated the document ");
    res.redirect('/mainmenu');
  
  });
});
});

app.post('/updatesession', function(req, res, next) {
 // res.render('index', { title: 'Express' });
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('sessionyear');
  //  console.log(req.body)
  collection.updateOne ({'username':req.body.userid}
    , { $set: {'formdate':req.body.formdate,'todate':req.body.todate,'displaylike':req.body.displaylike,'description':req.body.description} }, null, function(err, result) {

    assert.equal(err, null);
    console.log("Updated the document");
  
  });
});


 res.redirect('/viewallsession');
});




app.post('/addnewsession', function(req, res, next) {
    MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('sessionyear');
    collcetion.insertOne({'username':global.name,'formdate':req.body.fromdate,'todate':req.body.todate,'displaylike':req.body.displaylike,'description':req.body.description},function(err,res){
        assert.equal(err,null);
            console.log('Inserted document successfully!!'+res);
            db.close();
    });
});
 res.redirect('html/success.html');
});




app.post('/respcattwo', function(req, res, next) {


//	console.log(req.body.isupdateid);
	if(req.body.isupdateid==="true")
	{
		//perform updation based upon the objectid value _id =     global.updatecattwoid
		MongoClient.connect(url,function(err,db){
		    assert.equal(err,null);
		    var collection = db.collection('rescattwo');
		  collection.updateOne ({'_id':global.updatecattwoid}
		    , { $set: { 'session':req.body.session ,'category':req.body.category,'activity':req.body.activity,'description':req.body.description,'duration_type':req.body.duration_type,'duration':req.body.duration,'api_score':req.body.api_score}}, null, function(err, result) {

		    assert.equal(err, null);
		    console.log("Updated the document ");
		  
		  });
		});


	}
	else
	{
		//perform insertion
		//1st check for redendency

			    			//insertion
							    MongoClient.connect(url,function(err,db){
							    assert.equal(err,null);
							    var collcetion = db.collection('rescattwo');
							    collcetion.insertOne({'session':req.body.session,'username':global.name,'category':req.body.category,'activity':req.body.activity,'description':req.body.description,'duration_type':req.body.duration_type,'duration':req.body.duration,'api_score':req.body.api_score},function(err,res){
							        assert.equal(err,null);
							            console.log('Inserted document successfully!!'+res);
							            db.close();
							    	});
								});

			 





	}

 res.redirect('/cattwo');
});
//post req from category 3 form
app.post('/catthreeone', function(req, res, next) {






//	console.log(req.body.isupdateid);
	if(req.body.isupdateid==="true")
	{
		//perform updation based upon the objectid value _id =     global.updatecattwoid
		MongoClient.connect(url,function(err,db){
		    assert.equal(err,null);
		    var collection = db.collection('catthreeone');
		  collection.updateOne ({'_id':global.updatecatthreeoneid}


		    , { $set: { 'session':req.body.session,'username':global.name,'category':req.body.category,'activity':req.body.activity,'description':req.body.description,'duration_type':req.body.duration_type,'duration':req.body.duration,'api_score':req.body.api_score}}, null, function(err, result) {

		    assert.equal(err, null);
		   // console.log("Updated the document ");
		  
		  });
		});
	}
	else
	{
    MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('catthreeone');
    collcetion.insertOne({'session':req.body.session,'username':global.name,'category':req.body.category,'title':req.body.title,'issn_isbn':req.body.issn_isbn,'total_Coauthors':req.body.total_Coauthors,'peer_reviewed':req.body.peer_reviewed,'main_author':req.body.main_author,'api_score':req.body.api_score},function(err,res){
        assert.equal(err,null);
            console.log('Inserted document successfully!!'+res);
            db.close();
	    });
	  });
	}















  res.redirect('html/catthreeone.html');
});



app.post('/catthreetwo', function(req, res, next) {

	if(req.body.isupdateid==="true")
	{
		//perform updation based upon the objectid value _id =     global.updatecattwoid
		MongoClient.connect(url,function(err,db){
		    assert.equal(err,null);
		    var collection = db.collection('catthreetwo');
		  collection.updateOne ({'_id':global.updatecatthreetwoid}


		    , { $set: { 'session':req.body.session,'username':global.name,'title':req.body.title,'issn_isbn':req.body.issn_isbn,'Conference_publication':req.body.Conference_publication,'total_Coauthors':req.body.total_Coauthors,'main_author':req.body.main_author,'api_score':req.body.api_score}}, null, function(err, result) {

		    assert.equal(err, null);
		   // console.log("Updated the document ");
		  
		  });
		});
	}
	else
	{


		    MongoClient.connect(url,function(err,db){
		    assert.equal(err,null);
		    var collcetion = db.collection('catthreetwo');
		    collcetion.insertOne({'session':req.body.session,'username':global.name,'title':req.body.title,'issn_isbn':req.body.issn_isbn,'Conference_publication':req.body.Conference_publication,'total_Coauthors':req.body.total_Coauthors,'main_author':req.body.main_author,'api_score':req.body.api_score},function(err,res){
		        assert.equal(err,null);
		            console.log('Inserted document successfully!!'+res);
		            db.close();
		    });
		  });


 }






  res.redirect('html/catthreetwo.html');
});

app.post('/catthreethree', function(req, res, next) {
	
if(req.body.isupdateid==="true")
	{
		MongoClient.connect(url,function(err,db){
		    assert.equal(err,null);
		    var collection = db.collection('catthreethree');
		  collection.updateOne ({'_id':global.updatecatthreethreeid}


		    , { $set: {'session':req.body.session,'username':global.name,'title':req.body.title,'issn_isbn':req.body.issn_isbn,'book_type_and_authorship':req.body.book_type_and_authorship,'peer_reviewed':req.body.peer_reviewed,'total_Coauthors':req.body.total_Coauthors,'main_author':req.body.main_author,'api_score':req.body.api_score}}, null, function(err, result) {

		    assert.equal(err, null);
		   // console.log("Updated the document ");
		  });
		});
	}
	else
	{
		      MongoClient.connect(url,function(err,db){
			    assert.equal(err,null);
			    var collcetion = db.collection('catthreethree');
			    collcetion.insertOne({'session':req.body.session,'username':global.name,'title':req.body.title,'issn_isbn':req.body.issn_isbn,'book_type_and_authorship':req.body.book_type_and_authorship,'peer_reviewed':req.body.peer_reviewed,'total_Coauthors':req.body.total_Coauthors,'main_author':req.body.main_author,'api_score':req.body.api_score},function(err,res){
			        assert.equal(err,null);
			            console.log('Inserted document successfully!!'+res);
			            db.close();
			    });
			  });
    }
  res.redirect('html/catthreethree.html');
});



app.post('/catthreefour', function(req, res, next) {

if(req.body.isupdateid==="true")
	{
		MongoClient.connect(url,function(err,db){
		    assert.equal(err,null);
		    var collection = db.collection('catthreefour');
		  collection.updateOne ({'_id':global.updatecatthreefourid}


		    , { $set: {'session':req.body.session,'username':global.name,'title':req.body.title,'Agency':req.body.Agency,'grant_in_lakh':req.body.grant_in_lakh,'duration_type':req.body.duration_type,'duration':req.body.duration,'api_score':req.body.api_score}}, null, function(err, result) {

		    assert.equal(err, null);
		   // console.log("Updated the document ");
		  });
		});
	}
	else
	{
	    MongoClient.connect(url,function(err,db){
	    assert.equal(err,null);
	    var collcetion = db.collection('catthreefour');
	    collcetion.insertOne({'session':req.body.session,'username':global.name,'title':req.body.title,'Agency':req.body.Agency,'grant_in_lakh':req.body.grant_in_lakh,'duration_type':req.body.duration_type,'duration':req.body.duration,'api_score':req.body.api_score},function(err,res){
	        assert.equal(err,null);
	            console.log('Inserted document successfully!!'+res);
	            db.close();
	    });
	  });
    }
  res.redirect('html/catthreefour.html');
});


app.post('/catthreefive', function(req, res, next) {
	if(req.body.isupdateid==="true")
	{
		MongoClient.connect(url,function(err,db){
		    assert.equal(err,null);
		    var collection = db.collection('catthreefive');
		  collection.updateOne ({'_id':global.updatecatthreefiveid}


		    , { $set: {'session':req.body.session,'username':global.name,'degree':req.body.degree,'Number_Enrolled':req.body.Number_Enrolled,'Thesis_Submitted':req.body.Thesis_Submitted,'Degree_awarded':req.body.Degree_awarded,'api_score':req.body.api_score}}, null, function(err, result) {

		    assert.equal(err, null);
		 //   console.log("Updated the document ");
		  });
		});
	}
	else
	{
	   
			    MongoClient.connect(url,function(err,db){
			    assert.equal(err,null);
			    var collcetion = db.collection('catthreefive');
			    collcetion.insertOne({'session':req.body.session,'username':global.name,'degree':req.body.degree,'Number_Enrolled':req.body.Number_Enrolled,'Thesis_Submitted':req.body.Thesis_Submitted,'Degree_awarded':req.body.Degree_awarded,'api_score':req.body.api_score},function(err,res){
			        assert.equal(err,null);
			            console.log('Inserted document successfully!!'+res);
			            db.close();
			    });
			  });

    }





  res.redirect('html/catthreefive.html');
});

app.post('/catthreesix', function(req, res, next) {
		if(req.body.isupdateid==="true")
	{
		MongoClient.connect(url,function(err,db){
		    assert.equal(err,null);
		    var collection = db.collection('catthreesix');
		  collection.updateOne ({'_id':global.updatecatthreesixid}


		    , { $set: {'session':req.body.session,'username':global.name,'program':req.body.program,'duration_type':req.body.duration_type,'Duration':req.body.Duration,'Organized_by':req.body.Organized_by,'api_score':req.body.api_score}}, null, function(err, result) {

		    assert.equal(err, null);
		 //   console.log("Updated the document ");
		  });
		});
	}
	else
	{
	 
			  
		    MongoClient.connect(url,function(err,db){
		    assert.equal(err,null);
		    var collcetion = db.collection('catthreesix');
		    collcetion.insertOne({'session':req.body.session,'username':global.name,'program':req.body.program,'duration_type':req.body.duration_type,'Duration':req.body.duration,'Organized_by':req.body.Organized_by,'api_score':req.body.api_score},function(err,res){
		        assert.equal(err,null);
		            console.log('Inserted document successfully!!'+res);
		            db.close();
		    });
		  });


    }
  res.redirect('html/catthreesix.html');
});



app.post('/catthreeseven', function(req, res, next) {
			if(req.body.isupdateid==="true")
	{
		MongoClient.connect(url,function(err,db){
		    assert.equal(err,null);
		    var collection = db.collection('catthreeseven');
		  collection.updateOne ({'_id':global.updatecatthreesevenid}


		    , { $set: {'session':req.body.session,'username':global.name,'category':req.body.category,'title':req.body.title,'Title_of_Conference_Seminar':req.body.Title_of_Conference_Seminar,'date_event':req.body.date_event,'Organised_by':req.body.Organised_by,'Whether_Internation_National_State':req.body.Whether_Internation_National_State,'api_score':req.body.api_score}}, null, function(err, result) {

		    assert.equal(err, null);
		 //   console.log("Updated the document ");
		  });
		});
	}
	else
	{
	   
			  
		    
		    MongoClient.connect(url,function(err,db){
		    assert.equal(err,null);
		    var collcetion = db.collection('catthreeseven');
		    collcetion.insertOne({'session':req.body.session,'username':global.name,'category':req.body.category,'title':req.body.title,'Title_of_Conference_Seminar':req.body.Title_of_Conference_Seminar,'date_event':req.body.date_event,'Organised_by':req.body.Organised_by,'Whether_Internation_National_State':req.body.Whether_Internation_National_State,'api_score':req.body.api_score},function(err,res){
		        assert.equal(err,null);
		            console.log('Inserted document successfully!!'+res);
		            db.close();
		    });
		  });


    }
  res.redirect('html/catthreeseven.html');
});






















app.post('/checkuid', function(req, res, next) {
  //res.body.uid;
 /* console.log(req.body.tel)*/
  MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('responce');
    collection.find({'username':req.body.uid}).toArray(function(err,docs){
    assert.equal(err,null);
    if(docs.length == 0){
    //   console.log(docs); 


MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('responce');
  collection.updateOne ({'telephone':req.body.tel}
    , { $set: {'username':req.body.uid} }, null, function(err, result) {

    assert.equal(err, null);
 //   console.log("Updated the document ");
  
  });
});



       res.redirect('html/success.html');
    }
    else
    {
      //  console.log('uid already present');
        res.redirect('html/uid.html?try=yes');

    }

    
    db.close();
    }); 
});

    
});

app.post('/resp', function(req, res, next) {
 //when user submits the form
 var mailOptions = {
 	/*var text = 'information you have provided -> name : '+req.body.name;*/
 	/*+'father : '+req.body.father+'mother : '+req.body.mother+'department : '+req.body.department+'designation : ' + req.body.designation+'pay : '+req.body.pay+'last_promo : '+req.body.last_promo+'caddress : '+req.body.caddress+'paddress : '+req.body.paddress+'telephone : '+req.body.telephone+'email : '+req.body.email+'category : '+ req.body.category ;*/
 /*	+ 'activity : ' + req.body.activity +'avg_hrs : '+req.body.avg_hrs+'api_score :'+req.body.api_score;*/
    from: 'hmharsh3@gmail.com', // sender address
    to: req.body.email, // list of receivers
    subject: 'Self-Assessment information submission', // Subject line
    text: 'information you have provided-> \n   Name : '+req.body.name+' \n Father : '+req.body.father+'\n Mother : '+req.body.mother+'\n Department : '+ req.body.department+' \n Designation : ' + req.body.designation+' \n Pay : '+req.body.pay+'\n Last Promotion Date : '+req.body.last_promo+'\n Current address : '+req.body.caddress+'\n Permanant address : '+req.body.paddress+'\n Telephone : '+req.body.telephone+'\n Email : '+req.body.email+'\n Please Login Back for further updations' //, // plaintext body
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
.get(function (req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('responce');
    collcetion.deleteOne({username:req.params.uid}, function(err, result) {
    assert.equal(err, null);
    console.log("Removed the document of uid  "+ req.params.uid );
  });
});
res.redirect('back');
});
app.route('/html/logindata/:uid')
//delete particular field
.get(function (req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('accounts');
    collcetion.deleteOne({user:req.params.uid}, function(err, result) {
    assert.equal(err, null);
    console.log("Removed the document of uid  "+ req.params.uid );
  });
});
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('responce');
 //   console.log(req.body)
  collection.updateOne ({'username':req.params.uid}
    , { $set: {'username':"deleted account"} }, null, function(err, result) {
//removed (from above line) :- 'session':req.body.session,
    assert.equal(err, null);
    console.log("Updated the document ");

  
  });
});




res.redirect('back');
});



app.route('/html/updatecattwo/:uid')
//delete particular field in categort two table database
.get(function (req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('rescattwo');
    collcetion.deleteOne({username:req.params.uid}, function(err, result) {
    assert.equal(err, null);
    console.log("Removed the document of uid  "+ req.params.uid );
  });
});
res.redirect('back');
});




app.route('/html/deletesession/:uid')
//delete particular field in categort two table database
.get(function (req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('sessionyear');
    collcetion.deleteOne({username:req.params.uid}, function(err, result) {
    assert.equal(err, null);
    console.log("Removed the document of uid  "+ req.params.uid );
  });
});
res.redirect('back');
});

/*
app.route('/:uid')
.get(function (req, res, next) {
//delete particular field

 res.redirect("http://localhost:3000/html/home.html?val=" + req.params.uid);
});*/


app.get('/:uid', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect("html/update.html?val=" + req.params.uid);
});
app.get('/updatesession/:uid', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.redirect("/html/updatesession.html?val=" + req.params.uid);
});
app.get('/updatecattwo/:uid/:category/:activity/:description/:duration_type/:duration/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //res.redirect("/html/cattwo.html?val=" + req.params.uid);
 
//setting updatecattwoid accordingly and inserting object id corrospondingly

MongoClient.connect(url,function(err,db){
			    assert.equal(err,null);
			    var collection = db.collection('rescattwo');
			   
			     collection.find({'username':req.params.uid,'category':req.params.category,'activity':req.params.activity,'description':req.params.description,'duration_type':req.params.duration_type,'duration':req.params.duration,'api_score':req.params.api_score}).toArray(function(err,docs){
			    assert.equal(err,null);
			     //res.setHeader('Content-Type', 'application/json');
			    //res.send(docs);
			    global.updatecattwoid = docs[0]._id;
			   // console.log(global.updatecattwoid);
			    //console.log("harshit mahajannnn"+docs[0]);
			    db.close();
    			});
     });
global.name = req.params.uid;
res.redirect("/html/cattwo.html?username=" + req.params.uid+"&category="+req.params.category+"&activity="+req.params.activity+"&description="+req.params.description+"&duration_type="+req.params.duration_type+"&duration="+req.params.duration+"&api_score="+req.params.api_score);

});

app.get('/html/updatecattwo/:username/:category/:activity/:duration_type/:duration/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //res.redirect("/html/cattwo.html?val=" + req.params.uid);
 //res.redirect("/html/cattwo.html?username=" + req.params.uid+"&category="+req.params.category+"&activity="+req.params.activity+"&duration_type="+req.params.duration_type+"&duration="+req.params.duration+"&api_score="+req.params.api_score);
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('rescattwo');
    collcetion.deleteOne({'username':req.params.username,'category':req.params.category,'activity':req.params.activity,'duration_type':req.params.duration_type,'duration':req.params.duration,'api_score':req.params.api_score}, function(err, result) {
    assert.equal(err, null);
    console.log("Removed the document of uid  "+ req.params.username );
  });
});
res.redirect('back');


//res.end("got it!!");

});




app.get('/data/viewalldatacattwo', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('rescattwo');
    collection.find({}).toArray(function(err,docs){



 assert.equal(err,null);
     var json2Csv = new SimpleJson2Csv({
  fields: [ 
  { name: "session", header: "session" },
    { name: "category", header: "category" },
    { name: "activity", header: "activity" },
     { name: "description", header: "description" },
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

app.get('/data/viewdatacattwo', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('rescattwo');
    collection.find({'username':global.name}).toArray(function(err,docs){
    assert.equal(err,null);
    
     res.setHeader('Content-Type', 'application/json');
     res.send(docs);
       db.close();
    }); 
    
});

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



app.get('/data/viewcattwodata/:username/:category/:activity/:description/:duration_type/:duration/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //console.log(req.params.uid);
 //sending data  of uid
 //res.redirect("http://localhost:3000/html/update.html?val=" + req.params.uid);
MongoClient.connect(url,function(err,db){
//	console.log("yyyyyyy"+req.params.description);
    assert.equal(err,null);
    var collection = db.collection('rescattwo');
    collection.find({'username':req.params.username,'category':req.params.category,'activity':req.params.activity,'description':req.params.description,'duration_type':req.params.duration_type,'duration':req.params.duration,'api_score':req.params.api_score}).toArray(function(err,docs){
    assert.equal(err,null);
     res.setHeader('Content-Type', 'application/json');
    res.send(docs);
    db.close();
    }); });
});








app.get('/data/viewlogindata', function(req, res, next) {
	MongoClient.connect(url,function(err,db){
	assert.equal(err,null);
	var collection = db.collection('accounts');
	collection.find({}).toArray(function(err,docs){
	assert.equal(err,null);
	 res.setHeader('Content-Type', 'application/json');
	 res.send(docs);
       db.close();
	});	
	
});
});



app.get('/data/viewsession', function(req, res, next) {


		MongoClient.connect(url,function(err,db){
	assert.equal(err,null);
	var collection = db.collection('sessionyear');
	collection.find({}).toArray(function(err,docs){
	assert.equal(err,null);
	//console.log(docs);  
	

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


app.get('/downloadcattwo', function(req, res, next) {
 // res.render('index', { title: 'Express' });
/*var file = __dirname + '/../public/data.csv';*/ //for inside public folder
var file = __dirname + '/../datacattwo.csv'
  res.download(file); // Set disposition and send it.

});


app.get('/downloaddata', function(req, res, next) {
 // res.render('index', { title: 'Express' });
/*var file = __dirname + '/../public/data.csv';*/ //for inside public folder
var file = __dirname + '/../data.csv'
  res.download(file); // Set disposition and send it.

});



app.get('/data/session', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //console.log(req.params.uid);
 //sending data  of uid
 //res.redirect("http://localhost:3000/html/update.html?val=" + req.params.uid);
MongoClient.connect(url,function(err,db){
			    assert.equal(err,null);
			    var collection = db.collection('sessionyear');
			    collection.find({},{displaylike:1,_id:0}).toArray(function(err,docs){
			    assert.equal(err,null);
			     res.setHeader('Content-Type', 'application/json');
			    res.send(docs);
			    db.close();
    			});
     });

});










app.get('/data/viewdatacatthreeone', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreeone');
    collection.find({'username':global.name}).toArray(function(err,docs){
    assert.equal(err,null);
    
     res.setHeader('Content-Type', 'application/json');
     res.send(docs);
       db.close();
    }); 
    
});
});
app.get('/data/viewdatacatthreetwo', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreetwo');
    collection.find({'username':global.name}).toArray(function(err,docs){
    assert.equal(err,null);
    
     res.setHeader('Content-Type', 'application/json');
     res.send(docs);
       db.close();
    }); 
    
});
});


app.get('/data/viewdatacatthreefour', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreefour');
    collection.find({'username':global.name}).toArray(function(err,docs){
    assert.equal(err,null);
    
     res.setHeader('Content-Type', 'application/json');
     res.send(docs);
       db.close();
    }); 
    
});
});


app.get('/data/viewdatacatthreefive', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreefive');
    collection.find({'username':global.name}).toArray(function(err,docs){
    assert.equal(err,null);
    
     res.setHeader('Content-Type', 'application/json');
     res.send(docs);
       db.close();
    }); 
    
});
});

app.get('/data/viewdatacatthreesix', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreesix');
    collection.find({'username':global.name}).toArray(function(err,docs){
    assert.equal(err,null);
    
     res.setHeader('Content-Type', 'application/json');
     res.send(docs);
       db.close();
    }); 
    
});
});
app.get('/data/viewdatacatthreeseven', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreeseven');
    collection.find({'username':global.name}).toArray(function(err,docs){
    assert.equal(err,null);
    
     res.setHeader('Content-Type', 'application/json');
     res.send(docs);
       db.close();
    }); 
    
});
});







app.get('/updatecatthreeone/:uid/:category/:title/:issn_isbn/:total_Coauthors/:peer_reviewed/:main_author/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //res.redirect("/html/cattwo.html?val=" + req.params.uid);
//setting updatecattwoid accordingly and inserting object id corrospondingly
//updation
MongoClient.connect(url,function(err,db){
			    assert.equal(err,null);
			    var collection = db.collection('catthreeone');
			   //console.log({'username':req.params.uid,'category':req.params.category,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'total_Coauthors':req.params.total_Coauthors,'peer_reviewed':req.params.peer_reviewed,'main_author':req.params.main_author,'api_score':req.params.api_score});
			     collection.find({'username':req.params.uid,'category':req.params.category,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'total_Coauthors':req.params.total_Coauthors,'peer_reviewed':req.params.peer_reviewed,'main_author':req.params.main_author,'api_score':req.params.api_score}).toArray(function(err,docs){
			    assert.equal(err,null);
			     //res.setHeader('Content-Type', 'application/json');
			    //console.log(docs);
			    global.updatecatthreeoneid = docs[0]._id;
			   // console.log(global.updatecatthreeoneid);
			    db.close();
    			});
       });
global.name = req.params.uid;
res.redirect("/html/catthreeone.html?username=" + req.params.uid+"&category="+req.params.category+"&title="+req.params.title+"&issn_isbn="+req.params.issn_isbn+"&total_Coauthors="+req.params.total_Coauthors+ "&peer_reviewed="+req.params.peer_reviewed + "&main_author="+req.params.main_author+"&api_score="+req.params.api_score);
});
 
app.get('/html/updatecatthreeone/:uid/:category/:title/:issn_isbn/:total_Coauthors/:peer_reviewed/:main_author/:api_score', function(req, res, next) {
//deletion of particular field
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('catthreeone');
    collcetion.deleteOne({'username':req.params.uid,'category':req.params.category,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'total_Coauthors':req.params.total_Coauthors,'peer_reviewed':req.params.peer_reviewed,'main_author':req.params.main_author,'api_score':req.params.api_score}, function(err, result) {
    assert.equal(err, null);
    console.log("Removed the document of uid  "+ req.params.username );
  });
});
res.redirect('back');
}); 

//to show data ,json at tim of updation
app.get('/data/viewcatthreeonedata/:uid/:category/:title/:issn_isbn/:total_Coauthors/:peer_reviewed/:main_author/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //console.log(req.params.uid);
 //sending data  of uid
 //res.redirect("http://localhost:3000/html/update.html?val=" + req.params.uid);

MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreeone');
     collection.find({'username':req.params.uid,'category':req.params.category,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'total_Coauthors':req.params.total_Coauthors,'peer_reviewed':req.params.peer_reviewed,'main_author':req.params.main_author,'api_score':req.params.api_score}).toArray(function(err,docs){
    assert.equal(err,null);
     res.setHeader('Content-Type', 'application/json');
    res.send(docs);
    db.close();
    }); });
});



app.get('/data/viewalldatacatthreeone', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreeone');
    collection.find({}).toArray(function(err,docs){



 assert.equal(err,null);
     var json2Csv = new SimpleJson2Csv({
  fields: [ 
  { name: "session", header: "session" },
   { name: "username", header: "username" },
    { name: "category", header: "category" },
    { name: "title", header: "title" },
     { name: "issn_isbn", header: "issn_isbn" },
    { name: "total_Coauthors", header: "total_Coauthors" },
    { name: "peer_reviewed", header: "peer_reviewed" },
    { name: "main_author", header: "main_author" },
    { name: "api_score", header: "api_score" },
      

  ],
  data:  docs
    /*[{ name: "John Blue", email: "john.blue@domain.com" },
    { name: "Lab Black", email: "lab.black@domain.com" }]*/
   
  
});
json2Csv.pipe(fs.createWriteStream('datacatthreeone.csv'));

    	  res.setHeader('Content-Type', 'application/json');
		     res.send(docs);
		       db.close();
    	}); 
     }); 
});




app.get('/downloadcatthreeone', function(req, res, next) {
/*var file = __dirname + '/../../public/data.csv';*/ //for file inside public folder
var file = __dirname + '/../../datacatthreeone.csv';
  res.download(file); // Set disposition and send it.

});

































// for catthreetwo
app.get('/updatecatthreetwo/:uid/:title/:issn_isbn/:Conference_publication/:total_Coauthors/:main_author/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //res.redirect("/html/cattwo.html?val=" + req.params.uid);
//setting updatecattwoid accordingly and inserting object id corrospondingly
//updation
MongoClient.connect(url,function(err,db){
			    assert.equal(err,null);
			    var collection = db.collection('catthreetwo');
			   //console.log({'username':req.params.uid,'category':req.params.category,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'total_Coauthors':req.params.total_Coauthors,'peer_reviewed':req.params.peer_reviewed,'main_author':req.params.main_author,'api_score':req.params.api_score});
			     collection.find({'username':req.params.uid,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'Conference_publication':req.params.Conference_publication,'total_Coauthors':req.params.total_Coauthors,'main_author':req.params.main_author,'api_score':req.params.api_score}).toArray(function(err,docs){
			    assert.equal(err,null);
			     //res.setHeader('Content-Type', 'application/json');
			    //console.log(docs);
			    global.updatecatthreetwoid = docs[0]._id;
			   // console.log(global.updatecatthreeoneid);
			    db.close();
    			});
       });
global.name = req.params.uid;
res.redirect("/html/catthreetwo.html?username=" + req.params.uid+"&title="+req.params.title+"&issn_isbn="+req.params.issn_isbn+ "&Conference_publication="+req.params.Conference_publication+"&total_Coauthors="+req.params.total_Coauthors + "&main_author="+req.params.main_author+"&api_score="+req.params.api_score);
});
 
app.get('/html/updatecatthreetwo/:uid/:title/:issn_isbn/:Conference_publication/:total_Coauthors/:main_author/:api_score', function(req, res, next) {
//deletion of particular field
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('catthreetwo');
    collcetion.deleteOne({'username':req.params.uid,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'Conference_publication':req.params.Conference_publication,'total_Coauthors':req.params.total_Coauthors,'main_author':req.params.main_author,'api_score':req.params.api_score}, function(err, result) {
    assert.equal(err, null);
    console.log("Removed the document of uid  "+ req.params.username );
  });
});
res.redirect('back');
}); 

//to show data ,json at tim of updation
app.get('/data/viewcatthreetwodata/:uid/:title/:issn_isbn/:Conference_publication/:total_Coauthors/:main_author/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //console.log(req.params.uid);
 //sending data  of uid
 //res.redirect("http://localhost:3000/html/update.html?val=" + req.params.uid);


MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreetwo');
     collection.find({'username':req.params.uid,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'Conference_publication':req.params.Conference_publication,'total_Coauthors':req.params.total_Coauthors,'main_author':req.params.main_author,'api_score':req.params.api_score}).toArray(function(err,docs){
    assert.equal(err,null);
     res.setHeader('Content-Type', 'application/json');
    res.send(docs);
    db.close();
    }); });
});



app.get('/data/viewalldatacatthreetwo', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreetwo');
    collection.find({}).toArray(function(err,docs){



 assert.equal(err,null);
     var json2Csv = new SimpleJson2Csv({
  fields: [ 
  { name: "session", header: "session" },
   { name: "username", header: "username" },
    { name: "title", header: "title" },
     { name: "issn_isbn", header: "issn_isbn" },
     { name : "Conference_publication", header : "Conference_publication"},
    { name: "total_Coauthors", header: "total_Coauthors" },
    { name: "main_author", header: "main_author" },
    { name: "api_score", header: "api_score" },
      

  ],
  data:  docs
    /*[{ name: "John Blue", email: "john.blue@domain.com" },
    { name: "Lab Black", email: "lab.black@domain.com" }]*/
   
  
});
json2Csv.pipe(fs.createWriteStream('datacatthreetwo.csv'));

    	  res.setHeader('Content-Type', 'application/json');
		     res.send(docs);
		       db.close();
    	}); 
     }); 
});



// for catthreethree
app.get('/updatecatthreethree/:uid/:title/:issn_isbn/:book_type_and_authorship/:peer_reviewed/:total_Coauthors/:main_author/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //res.redirect("/html/catthree.html?val=" + req.params.uid);
//setting updatecatthreeid accordingly and inserting object id corrospondingly
//updation
MongoClient.connect(url,function(err,db){
			    assert.equal(err,null);
			    var collection = db.collection('catthreethree');
			   //console.log({'username':req.params.uid,'category':req.params.category,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'total_Coauthors':req.params.total_Coauthors,'peer_reviewed':req.params.peer_reviewed,'main_author':req.params.main_author,'api_score':req.params.api_score});
			     collection.find({'username':req.params.uid,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'book_type_and_authorship':req.params.book_type_and_authorship,'peer_reviewed':req.params.peer_reviewed,'total_Coauthors':req.params.total_Coauthors,'main_author':req.params.main_author,'api_score':req.params.api_score}).toArray(function(err,docs){
			    assert.equal(err,null);
			     //res.setHeader('Content-Type', 'application/json');
			    //console.log(docs);
			    global.updatecatthreethreeid = docs[0]._id;
			    console.log(global.updatecatthreeoneid);
			    db.close();
    			});
       });
global.name = req.params.uid;
res.redirect("/html/catthreethree.html?username=" + req.params.uid+"&title="+req.params.title+"&issn_isbn="+req.params.issn_isbn+ "&book_type_and_authorship="+req.params.book_type_and_authorship+"&peer_reviewed="+req.params.peer_reviewed+"&total_Coauthors="+req.params.total_Coauthors + "&main_author="+req.params.main_author+"&api_score="+req.params.api_score);
});
 
app.get('/html/updatecatthreethree/:uid/:title/:issn_isbn/:book_type_and_authorship/:peer_reviewed/:total_Coauthors/:main_author/:api_score', function(req, res, next) {
//deletion of particular field
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('catthreethree');
    collcetion.deleteOne({'username':req.params.uid,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'book_type_and_authorship':req.params.book_type_and_authorship,'peer_reviewed':req.params.peer_reviewed,'total_Coauthors':req.params.total_Coauthors,'main_author':req.params.main_author,'api_score':req.params.api_score}, function(err, result) {
    assert.equal(err, null);
    console.log("Removed the document of uid  "+ req.params.username );
  });
});
res.redirect('back');
}); 

//to show data ,json at tim of updation
app.get('/data/viewcatthreethreedata/:uid/:title/:issn_isbn/:book_type_and_authorship/:peer_reviewed/:total_Coauthors/:main_author/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //console.log(req.params.uid);
 //sending data  of uid
 //res.redirect("http://localhost:3000/html/update.html?val=" + req.params.uid);


MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreethree');
     collection.find({'username':req.params.uid,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'book_type_and_authorship':req.params.book_type_and_authorship,'peer_reviewed':req.params.peer_reviewed,'total_Coauthors':req.params.total_Coauthors,'main_author':req.params.main_author,'api_score':req.params.api_score}).toArray(function(err,docs){
    assert.equal(err,null);
     res.setHeader('Content-Type', 'application/json');
    res.send(docs);
    db.close();
    }); });
});



app.get('/data/viewalldatacatthreethree', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreethree');
    collection.find({}).toArray(function(err,docs){



 assert.equal(err,null);
     var json2Csv = new SimpleJson2Csv({
  fields: [ 
  { name: "session", header: "session" },
   { name: "username", header: "username" },
    { name: "title", header: "title" },
     { name: "issn_isbn", header: "issn_isbn" },
     { name : "book_type_and_authorship", header : "book_type_and_authorship"},
     { name : "peer_reviewed", header : "peer_reviewed"},     
    { name: "total_Coauthors", header: "total_Coauthors" },
    { name: "main_author", header: "main_author" },
    { name: "api_score", header: "api_score" },
      

  ],
  data:  docs
    /*[{ name: "John Blue", email: "john.blue@domain.com" },
    { name: "Lab Black", email: "lab.black@domain.com" }]*/
   
  
});
json2Csv.pipe(fs.createWriteStream('datacatthreethree.csv'));

    	  res.setHeader('Content-Type', 'application/json');
		     res.send(docs);
		       db.close();
    	}); 
     }); 
});

app.get('/data/viewdatacatthreethree', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreethree');
    collection.find({'username':global.name}).toArray(function(err,docs){
    assert.equal(err,null);
    
     res.setHeader('Content-Type', 'application/json');
     res.send(docs);
       db.close();
    }); 
    
});
});














// for catthreefour
app.get('/updatecatthreefour/:uid/:title/:Agency/:grant_in_lakh/:duration_type/:duration/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //res.redirect("/html/catfour.html?val=" + req.params.uid);
//setting updatecatfourid accordingly and inserting object id corrospondingly
//updation
MongoClient.connect(url,function(err,db){
			    assert.equal(err,null);
			    var collection = db.collection('catthreefour');
			   //console.log({'username':req.params.uid,'category':req.params.category,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'total_Coauthors':req.params.total_Coauthors,'peer_reviewed':req.params.peer_reviewed,'main_author':req.params.main_author,'api_score':req.params.api_score});
			     collection.find({'username':req.params.uid,'title':req.params.title,'Agency':req.params.Agency,'grant_in_lakh':req.params.grant_in_lakh,'duration_type':req.params.duration_type,'duration':req.params.duration,'api_score':req.params.api_score}).toArray(function(err,docs){
			    assert.equal(err,null);
			     //res.setHeader('Content-Type', 'application/json');
			    //console.log(docs);
			    global.updatecatthreefourid = docs[0]._id;
			   // console.log(global.updatecatthreeoneid);
			    db.close();
    			});
       });
global.name = req.params.uid;
res.redirect("/html/catthreefour.html?username=" + req.params.uid+"&title="+req.params.title+"&Agency="+req.params.Agency+ "&grant_in_lakh="+req.params.grant_in_lakh+"&duration_type="+req.params.duration_type + "&duration="+req.params.duration+"&api_score="+req.params.api_score);
});
 
app.get('/html/updatecatthreefour/:uid/:title/:Agency/:grant_in_lakh/:duration_type/:duration/:api_score', function(req, res, next) {
//deletion of particular field
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('catthreefour');
    collcetion.deleteOne({'username':req.params.uid,'title':req.params.title,'Agency':req.params.Agency,'grant_in_lakh':req.params.grant_in_lakh,'duration_type':req.params.duration_type,'duration':req.params.duration,'api_score':req.params.api_score}, function(err, result) {
    assert.equal(err, null);
    console.log("Removed the document of uid  "+ req.params.username );
  });
});
res.redirect('back');
}); 

//to show data ,json at tim of updation
app.get('/data/viewcatthreefourdata/:uid/:title/:Agency/:grant_in_lakh/:duration_type/:duration/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //console.log(req.params.uid);
 //sending data  of uid
 //res.redirect("http://localhost:3000/html/update.html?val=" + req.params.uid);


MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreefour');
     collection.find({'username':req.params.uid,'title':req.params.title,'Agency':req.params.Agency,'grant_in_lakh':req.params.grant_in_lakh,'duration_type':req.params.duration_type,'duration':req.params.duration,'api_score':req.params.api_score}).toArray(function(err,docs){
    assert.equal(err,null);
     res.setHeader('Content-Type', 'application/json');
    res.send(docs);
    db.close();
    }); });
});



app.get('/data/viewalldatacatthreefour', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreefour');
    collection.find({}).toArray(function(err,docs){



 assert.equal(err,null);
     var json2Csv = new SimpleJson2Csv({
  fields: [ 
  { name: "session", header: "session" },
   { name: "username", header: "username" },
    { name: "title", header: "title" },
     { name: "Agency", header: "Agency" },
     { name : "grant_in_lakh", header : "grant_in_lakh"},
    { name: "duration_type", header: "duration_type" },
    { name: "duration", header: "duration" },
    { name: "api_score", header: "api_score" },
      

  ],
  data:  docs
    /*[{ name: "John Blue", email: "john.blue@domain.com" },
    { name: "Lab Black", email: "lab.black@domain.com" }]*/
   
  
});
json2Csv.pipe(fs.createWriteStream('datacatthreefour.csv'));

    	  res.setHeader('Content-Type', 'application/json');
		     res.send(docs);
		       db.close();
    	}); 
     }); 
});






/*http://localhost:3000/html/updatecatthreefive/yash/M.Phil_or_equivalent/12/thisis/degree/45
*/
// for catthreefive
app.get('/updatecatthreefive/:uid/:degree/:Number_Enrolled/:Thesis_Submitted/:Degree_awarded/:api_score', function(req, res, next) {
MongoClient.connect(url,function(err,db){
			    assert.equal(err,null);
			    var collection = db.collection('catthreefive');
			   //console.log({'username':req.params.uid,'category':req.params.category,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'total_Coauthors':req.params.total_Coauthors,'peer_reviewed':req.params.peer_reviewed,'main_author':req.params.main_author,'api_score':req.params.api_score});
			     collection.find({'username':req.params.uid,'degree':req.params.degree,'Number_Enrolled':req.params.Number_Enrolled,'Thesis_Submitted':req.params.Thesis_Submitted,'Degree_awarded':req.params.Degree_awarded,'api_score':req.params.api_score}).toArray(function(err,docs){
			    assert.equal(err,null);
			     //res.setHeader('Content-Type', 'application/json');
			    //console.log(docs);
			    global.updatecatthreefiveid = docs[0]._id;
			    //console.log(global.updatecatthreeoneid);
			    db.close();
    			});
       });
global.name = req.params.uid;
res.redirect("/html/catthreefive.html?username=" + req.params.uid+"&degree="+req.params.degree+"&Number_Enrolled="+req.params.Number_Enrolled+"&Thesis_Submitted="+req.params.Thesis_Submitted+ "&Degree_awarded="+req.params.Degree_awarded+"&api_score="+req.params.api_score);
});
 
app.get('/html/updatecatthreefive/:uid/:degree/:Number_Enrolled/:Thesis_Submitted/:Degree_awarded/:api_score', function(req, res, next) {
//deletion of particular field
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('catthreefive');
    collcetion.deleteOne({'username':req.params.uid,'degree':req.params.degree,'Number_Enrolled':req.params.Number_Enrolled,'Thesis_Submitted':req.params.Thesis_Submitted,'Degree_awarded':req.params.Degree_awarded,'api_score':req.params.api_score}, function(err, result) {
    assert.equal(err, null);
    console.log("Removed the document of uid  "+ req.params.username );
  });
});
res.redirect('back');
}); 

//to show data ,json at tim of updation
app.get('/data/viewcatthreefivedata/:uid/:degree/:Number_Enrolled/:Thesis_Submitted/:Degree_awarded/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //console.log(req.params.uid);
 //sending data  of uid
 //res.redirect("http://localhost:3000/html/update.html?val=" + req.params.uid);


MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreefive');
     collection.find({'username':req.params.uid,'degree':req.params.degree,'Number_Enrolled':req.params.Number_Enrolled,'Thesis_Submitted':req.params.Thesis_Submitted,'Degree_awarded':req.params.Degree_awarded,'api_score':req.params.api_score}).toArray(function(err,docs){
    assert.equal(err,null);
     res.setHeader('Content-Type', 'application/json');
    res.send(docs);
    db.close();
    }); });
});



app.get('/data/viewalldatacatthreefive', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreefive');
    collection.find({}).toArray(function(err,docs){



 assert.equal(err,null);
     var json2Csv = new SimpleJson2Csv({
  fields: [ 
  { name: "session", header: "session" },
   { name: "username", header: "username" },
    { name: "degree", header: "degree" },
     { name: "Number_Enrolled", header: "Number_Enrolled" },
     { name : "Thesis_Submitted", header : "Thesis_Submitted"},
    { name: "Degree_awarded", header: "Degree_awarded" },
    { name: "api_score", header: "api_score" },
      

  ],
  data:  docs
    /*[{ name: "John Blue", email: "john.blue@domain.com" },
    { name: "Lab Black", email: "lab.black@domain.com" }]*/
   
  
});
json2Csv.pipe(fs.createWriteStream('datacatthreefive.csv'));

    	  res.setHeader('Content-Type', 'application/json');
		     res.send(docs);
		       db.close();
    	}); 
     }); 
});





// for catthreesix
app.get('/updatecatthreesix/:uid/:session/:program/:duration_type/:Duration/:Organized_by/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //res.redirect("/html/catsix.html?val=" + req.params.uid);
//setting updatecatsixid accordingly and inserting object id corrospondingly
//updation
MongoClient.connect(url,function(err,db){
			    assert.equal(err,null);
			    var collection = db.collection('catthreesix');
			   //console.log({'username':req.params.uid,'category':req.params.category,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'total_Coauthors':req.params.total_Coauthors,'peer_reviewed':req.params.peer_reviewed,'main_author':req.params.main_author,'api_score':req.params.api_score});
			     collection.find({'username':req.params.uid,'session':req.params.session,'program':req.params.program,'duration_type':req.params.duration_type,'Duration':req.params.Duration,'Organized_by':req.params.Organized_by,'api_score':req.params.api_score}).toArray(function(err,docs){
			    assert.equal(err,null);
			     //res.setHeader('Content-Type', 'application/json');
			  //  console.log(docs);
			    global.updatecatthreesixid = docs[0]._id;
			  //  console.log(global.updatecatthreesixid);
			    db.close();
    			});
       });
global.name = req.params.uid;
res.redirect("/html/catthreesix.html?username=" + req.params.uid+"&session="+req.params.session+"&program="+req.params.program+"&duration_type="+req.params.duration_type+ "&Duration="+req.params.Duration+"&Organized_by="+req.params.Organized_by +"&api_score="+req.params.api_score);
});
 
app.get('/html/updatecatthreesix/:uid/:session/:program/:duration_type/:Duration/:Organized_by/:api_score', function(req, res, next) {
//deletion of particular field
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('catthreesix');
    collcetion.deleteOne({'username':req.params.uid,'session':req.params.session,'program':req.params.program,'duration_type':req.params.duration_type,'Duration':req.params.Duration,'Organized_by':req.params.Organized_by,'api_score':req.params.api_score}, function(err, result) {
    assert.equal(err, null);
    console.log("Removed the document of uid  "+ req.params.username );
  });
});
res.redirect('back');
}); 

//to show data ,json at tim of updation
app.get('/data/viewcatthreesixdata/:uid/:session/:program/:duration_type/:Duration/:Organized_by/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //console.log(req.params.uid);
 //sending data  of uid
 //res.redirect("http://localhost:3000/html/update.html?val=" + req.params.uid);


MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreesix');
     collection.find({'username':req.params.uid,'session':req.params.session,'program':req.params.program,'duration_type':req.params.duration_type,'Duration':req.params.Duration,'Organized_by':req.params.Organized_by,'api_score':req.params.api_score}).toArray(function(err,docs){
    assert.equal(err,null);
     res.setHeader('Content-Type', 'application/json');
    res.send(docs);
    db.close();
    }); });
});



app.get('/data/viewalldatacatthreesix', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreesix');
    collection.find({}).toArray(function(err,docs){



 assert.equal(err,null);
     var json2Csv = new SimpleJson2Csv({
  fields: [ 
  { name: "session", header: "session" },
   { name: "username", header: "username" },
    { name: "program", header: "program" },
     { name: "duration_type", header: "duration_type" },
     { name : "Duration", header : "Duration"},
    { name: "Organized_by", header: "Organized_by" },
    { name: "api_score", header: "api_score" },
      

  ],
  data:  docs
    /*[{ name: "John Blue", email: "john.blue@domain.com" },
    { name: "Lab Black", email: "lab.black@domain.com" }]*/
   
  
});
json2Csv.pipe(fs.createWriteStream('datacatthreesix.csv'));

    	  res.setHeader('Content-Type', 'application/json');
		     res.send(docs);
		       db.close();
    	}); 
     }); 
});


/* $http.get("/data/viewcatthreesevendata/"+getParameterByName('username')+"/"
 	+getParameterByName('category')+"/"+getParameterByName('title')+"/"+
 	getParameterByName('Title_of_Conference_Seminar')
 	+"/"+getParameterByName('date_event')+"/"+getParameterByName('Organised_by')+"/"+
 	getParameterByName('Whether_Internation_National_State')+
 	"/"+getParameterByName('api_score')).then
*/

// for catthreeseven
app.get('/updatecatthreeseven/:uid/:category/:title/:Title_of_Conference_Seminar/:date_event/:Organised_by/:Whether_Internation_National_State/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //res.redirect("/html/catseven.html?val=" + req.params.uid);
//setting updatecatsevenid accordingly and inserting object id corrospondingly
//updation
MongoClient.connect(url,function(err,db){
			    assert.equal(err,null);
			    var collection = db.collection('catthreeseven');
			   //console.log({'username':req.params.uid,'category':req.params.category,'title':req.params.title,'issn_isbn':req.params.issn_isbn,'total_Coauthors':req.params.total_Coauthors,'peer_reviewed':req.params.peer_reviewed,'main_author':req.params.main_author,'api_score':req.params.api_score});
			     collection.find({'username':req.params.uid,'category':req.params.category,'title':req.params.title,'Title_of_Conference_Seminar':req.params.Title_of_Conference_Seminar,'date_event':req.params.date_event,'Organised_by':req.params.Organised_by,'Whether_Internation_National_State':req.params.Whether_Internation_National_State,'api_score':req.params.api_score}).toArray(function(err,docs){
			    assert.equal(err,null);
			     //res.setHeader('Content-Type', 'application/json');
			    //console.log(docs);
			    global.updatecatthreesevenid = docs[0]._id;
			   // console.log(global.updatecatthreesevenid);
			    db.close();
    			});
       });
global.name = req.params.uid;
res.redirect("/html/catthreeseven.html?username=" + req.params.uid+"&category="+req.params.category+"&title="+req.params.title+"&Title_of_Conference_Seminar="+req.params.Title_of_Conference_Seminar+ "&date_event="+req.params.date_event+"&Organised_by="+req.params.Organised_by + "&Whether_Internation_National_State="+req.params.Whether_Internation_National_State+"&api_score="+req.params.api_score);
});
 
app.get('/html/updatecatthreeseven/:uid/:category/:title/:Title_of_Conference_Seminar/:date_event/:Organised_by/:Whether_Internation_National_State/:api_score', function(req, res, next) {
//deletion of particular field
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collcetion = db.collection('catthreeseven');
    collcetion.deleteOne({'username':req.params.uid,'category':req.params.category,'title':req.params.title,'Title_of_Conference_Seminar':req.params.Title_of_Conference_Seminar,'date_event':req.params.date_event,'Organised_by':req.params.Organised_by,'Whether_Internation_National_State':req.params.Whether_Internation_National_State,'api_score':req.params.api_score}, function(err, result) {
    assert.equal(err, null);
    console.log("Removed the document of uid  "+ req.params.username );
  });
});
res.redirect('back');
}); 

//to show data ,json at tim of updation
app.get('/data/viewcatthreesevendata/:uid/:category/:title/:Title_of_Conference_Seminar/:date_event/:Organised_by/:Whether_Internation_National_State/:api_score', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 //console.log(req.params.uid);
 //sending data  of uid
 //res.redirect("http://localhost:3000/html/update.html?val=" + req.params.uid);


MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreeseven');
     collection.find({'username':req.params.uid,'category':req.params.category,'title':req.params.title,'Title_of_Conference_Seminar':req.params.Title_of_Conference_Seminar,'date_event':req.params.date_event,'Organised_by':req.params.Organised_by,'Whether_Internation_National_State':req.params.Whether_Internation_National_State,'api_score':req.params.api_score}).toArray(function(err,docs){
    assert.equal(err,null);
     res.setHeader('Content-Type', 'application/json');
    res.send(docs);
    db.close();
    }); });
});



app.get('/data/viewalldatacatthreeseven', function(req, res, next) {
MongoClient.connect(url,function(err,db){
    assert.equal(err,null);
    var collection = db.collection('catthreeseven');
    collection.find({}).toArray(function(err,docs){



 assert.equal(err,null);
     var json2Csv = new SimpleJson2Csv({
  fields: [ 
  { name: "session", header: "session" },
   { name: "username", header: "username" },
    { name: "title", header: "title" },
     { name: "issn_isbn", header: "issn_isbn" },
     { name : "Conference_publication", header : "Conference_publication"},
    { name: "total_Coauthors", header: "total_Coauthors" },
    { name: "main_author", header: "main_author" },
    { name: "api_score", header: "api_score" },
      

  ],
  data:  docs
    /*[{ name: "John Blue", email: "john.blue@domain.com" },
    { name: "Lab Black", email: "lab.black@domain.com" }]*/
   
  
});
json2Csv.pipe(fs.createWriteStream('datacatthreeseven.csv'));

    	  res.setHeader('Content-Type', 'application/json');
		     res.send(docs);
		       db.close();
    	}); 
     }); 
});



















//app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });


//copied portion up to here

};
