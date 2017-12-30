import 'Components/synapse-ui/synapse-ui.scss';
import 'Components/firebase-config.js';
import firebase from 'firebase';

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
