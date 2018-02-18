import 'Components/auth/login/login.scss';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'Components/firebase-config';
import 'Components/auth/login/prev.mp4';
import  { triggerNegativeIndicator } from 'Components/synapse-ui/synapse-ui';

var auth = firebase.auth();

// get form elements
var formEmail = document.querySelector('.log-input-email');
var formPassword = document.querySelector('.log-input-password');
var formButtonLogin = document.querySelector('.log-in-button');

// log in on button press
formButtonLogin.addEventListener('click', e => {
    tryToLogin();
});

window.addEventListener('keydown', e => {
    if (e.keyCode === 13) {
        tryToLogin();
        formButtonLogin.focus();
    }
});

auth.onAuthStateChanged(firebaseUser => {
    if (firebaseUser) {
        console.log(firebaseUser)
        window.location = './index.html';
    }
    else {
        console.log('not logged in');
    }
});

// console.log(bahti)

function tryToLogin() {
    var email = formEmail.value;
    var pass = formPassword.value;
    var promise = auth.signInWithEmailAndPassword(email, pass);

    promise.catch(e => triggerNegativeIndicator(e.message));
}
