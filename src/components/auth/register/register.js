import 'Components/auth/register/register.scss';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'Components/firebase-config';
import  { triggerNegativeIndicator } from 'Components/synapse-ui/synapse-ui';

var auth = firebase.auth();

// get form elements
var formEmail = document.querySelector('.register-input-email');
var formPassword = document.querySelector('.register-input-password');
var formButtonRegister = document.querySelector('.register-button');

// register in on button press
formButtonRegister.addEventListener('click', e => {
    tryToRegister();
});

window.addEventListener('keydown', e => {
    if (e.keyCode === 13) {
        tryToRegister();
        formButtonLogin.focus();
    }
});

function confirmRegistration() {
	let heading = document.querySelector(".main-container h1");
	let regContainer = document.querySelector(".register-container");
	let regSuccess = document.querySelector(".register-success");
	let regFireworks = document.querySelector(".register-fireworks");

	heading.innerHTML = "All done!"

	regContainer.classList.add("hide");
	regSuccess.classList.remove("hide");
	regFireworks.classList.add("exploding");
}

function tryToRegister() {
    var email = formEmail.value;
    var pass = formPassword.value;
    var promise = auth.createUserWithEmailAndPassword(email, pass);

    promise
    	.catch(e => triggerNegativeIndicator(e.message))
    	.then(function(user){
    		if (user !== undefined) {
    			confirmRegistration();
    		}
    	})
}
