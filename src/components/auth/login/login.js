import './login.css';

// get form elements
var formEmail = document.querySelector('.log-input-email');
var formPassword = document.querySelector('.log-input-password');
var formButtonLogin = document.querySelector('.log-in-button');

formButtonLogin.addEventListener('click', e => {
    var email = formEmail.value;
    var pass = formPassword.value;
    var auth = firebase.auth();

    var promise = auth.signInWithEmailAndPassword(email, pass);

    promise.catch(e => console.log(e.message));
});
