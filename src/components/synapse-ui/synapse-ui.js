import 'Components/synapse-ui/synapse-ui.scss';
import * as firebase from 'firebase/app';
import 'firebase/auth';

// <-- sign out module
var auth = firebase.auth();
var synUILogout = document.querySelector('.syn-ui-logout');
var synUISync = document.querySelector('.syn-ui-sync');
var synUIIndicator = document.querySelector('.syn-ui-indicator');

auth.onAuthStateChanged(firebaseUser => {
    if (firebaseUser) {
        console.log('hi there');
    }
    else {
        window.location = './login.html';
    }
});

synUILogout.addEventListener('click', e => {
    auth.signOut();
})

function triggerSaveIndicator(msg) {
	// add things
	synUIIndicator.classList.add('syn-ui-indicator-ani', 'syn-ui-indicator-save');
	synUIIndicator.innerHTML="<i class=\"fa fa-birthday-cake\"></i>";
	synUIIndicator.append(msg)

	// remove things
	setTimeout(function(){
		synUIIndicator.classList.remove('syn-ui-indicator-ani');
		synUIIndicator.classList.remove('syn-ui-indicator-save');
		synUIIndicator.innerHTML = "";
	}, 3000)
}

function triggerDeleteIndicator(msg) {
	// add things
	synUIIndicator.classList.add('syn-ui-indicator-ani');
	synUIIndicator.classList.add('syn-ui-indicator-delete');
	synUIIndicator.innerHTML="<i class=\"fa fa-trash\"></i>";
	synUIIndicator.append(msg)

	// remove things
	setTimeout(function(){
		synUIIndicator.classList.remove('syn-ui-indicator-ani', 'syn-ui-indicator-delete');
		synUIIndicator.innerHTML = "";
	}, 3000)
}

export {triggerSaveIndicator, triggerDeleteIndicator}; 

// -->
