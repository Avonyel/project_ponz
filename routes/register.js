const express = require("express");
const router = express.Router();
const { User } = require("./../models");

router.get("/", (req, res) => {
	res.render("./register");
});

router.get("/:username", (req, res) => {
	res.render("./register", {referral:req.params.username});
});

router.post("/", (req, res, next) => {
	const userInfo = {
  	username: req.body.username,
  	password: req.body.password,
  	ponzBucks: 0,
  	referralCode: req.body.username	
  }

	if (req.body.referral) {
		let referral;
		let newUser;

		User.findOne({username: req.body.referral}).then(parent => {
			referral = parent;

			userInfo.parents = parent.parents.slice(0).map(parent=>{
					parent.distance+=1;
					return parent;
			});
			userInfo.parents.unshift({distance:0, ancestor:referral});

			const user = new User(userInfo);
	  	return user.save()
		}).then(user => {
			newUser = user; 
			return user.populate("parents")
		}).then(user => {
			let counter = 40;
			const updatedParents = user.parents.map(parent => {
				parent.ancestor.ponzBucks += counter;

				if (counter > 1) {
					counter = Math.floor(counter / 2);
				}
				return parent.save()
			})

			//save the parents
			return Promise.all(updatedParents);
		})
		.then(() => {
			referral.children.push(newUser);
			return referral.save();
		})
		.then(() => {
			return res.redirect("/")
		}).catch((e) => {
			req.flash("warning", `${e}`);
	  	res.redirect("back");
		})
	} else {
		const user = new User(userInfo);
		console.log(user);
		console.log(userInfo);
	  user.save().then(user => {
	  	console.log("saved a user...")
	  	req.login(user, function(err) {
	  		console.log("in the login...");
	      return res.redirect("/");
	    });
	  }).catch((e) => {
	  	req.flash("warning", `${e}`);
	  	res.redirect("back");
	  });
	}
});

module.exports = router;