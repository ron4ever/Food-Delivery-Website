


if(object == true){
    let changePublicBtn = document.getElementById("savePublic");
    changePublicBtn.onclick = goPublic;
}
else if(object == false){
    let changePrivateBtn = document.getElementById("savePrivate");
    changePrivateBtn.onclick = goPrivate;
}




function goPublic(){
    let xhttp = new XMLHttpRequest();
    
    xhttp.onreadystatechange = function() {
		//If the response is available and was successful
		if (this.readyState == 4 && this.status == 200) {
			
            let responseObject = JSON.parse(xhttp.responseText);
			window.location.replace(`/users/${responseObject}`);
		}
	};

		//If the response is available and was successful
	//Create the request
	xhttp.open("GET", `http://localhost:3000/goPublic`, true);
           
    xhttp.setRequestHeader("Content-Type", "application/json");  
    //send request
	xhttp.send();
}
    
function goPrivate(){
    let xhttp = new XMLHttpRequest();
    
    xhttp.onreadystatechange = function() {
		//If the response is available and was successful
		if (this.readyState == 4 && this.status == 200) {
			//console.log(xhttp.responseText);
            let responseObject = JSON.parse(xhttp.responseText);
			window.location.replace(`/users/${responseObject}`);
		}
	};
		//If the response is available and was successful
	//Create the request
	xhttp.open("GET", `http://localhost:3000/goPrivate`, true);
            //Note for future project if you want JSON set the requet header to accept and not to content-type you will get HTML
    xhttp.setRequestHeader("Content-Type", "application/json");  
    //send request
	xhttp.send();
}

