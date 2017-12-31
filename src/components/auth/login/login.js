import 'Components/auth/login/login.scss';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'Components/firebase-config';

var auth = firebase.auth();

// get form elements
var formEmail = document.querySelector('.log-input-email');
var formPassword = document.querySelector('.log-input-password');
var formButtonLogin = document.querySelector('.log-in-button');

// log in on button press
formButtonLogin.addEventListener('click', e => {
    var email = formEmail.value;
    var pass = formPassword.value;
    var promise = auth.signInWithEmailAndPassword(email, pass);

    // must do validation
    promise.catch(e => console.log(e.message));
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
