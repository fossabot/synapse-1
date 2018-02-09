import 'Components/synapse-ui/synapse-ui.scss';

// import test
console.log("what the shit evaluation");
var evaluate = "such imports";


// notifications
function triggerPositiveIndicator(msg) {
	var synUIIndicator = document.querySelector('.syn-ui-indicator');
	// add things
	synUIIndicator.classList.add('syn-ui-indicator-ani', 'syn-ui-indicator-positive');
	synUIIndicator.innerHTML="<i class=\"fa fa-birthday-cake\"></i>";
	synUIIndicator.append(msg)

	// remove things
	setTimeout(function(){
		synUIIndicator.classList.remove('syn-ui-indicator-ani', 'syn-ui-indicator-positive');
		synUIIndicator.innerHTML = "";
	}, 3000)
}

function triggerNegativeIndicator(msg) {
	var synUIIndicator = document.querySelector('.syn-ui-indicator');
	// add things
	synUIIndicator.classList.add('syn-ui-indicator-ani', 'syn-ui-indicator-negative');
	synUIIndicator.innerHTML="<i class=\"fa fa-frown-o\"></i>";
	synUIIndicator.append(msg)

	// remove things
	setTimeout(function(){
		synUIIndicator.classList.remove('syn-ui-indicator-ani', 'syn-ui-indicator-negative');
		synUIIndicator.innerHTML = "";
	}, 3000)
}

export { triggerPositiveIndicator, triggerNegativeIndicator }; 

// -->
