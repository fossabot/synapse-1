import './synapse-ui.css';
import * as firebase from 'firebase';
import '../firebase-config.js';

// <-- sign out module
var auth = firebase.auth();
var synUILogout = document.querySelector('.syn-ui-logout');

auth.onAuthStateChanged(firebaseUser => {
    if (firebaseUser) {
        console.log('logged-in');

    }
    else {
        window.location = './login.html';
    }
});

synUILogout.addEventListener('click', e => {
    auth.signOut();
})

// -->
