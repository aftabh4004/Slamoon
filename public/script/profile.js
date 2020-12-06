// taken from W3
// for making header float on the top
    window.onscroll = function() {myFunction()};

    var header = document.getElementById("header");
    var sticky = header.offsetTop;

    function myFunction() {
    if (window.pageYOffset > sticky) {
        header.classList.add("sticky");
    } else {
        header.classList.remove("sticky");
    }
}
// ==============================//



// Onclick on home icon 

var home = document.getElementById("logo");
home.addEventListener('click', () => {
    var id = document.getElementById('id_of_user').innerHTML;
    window.location.replace(`http://localhost:9000/profile/${id}`);
})


// Implementing Invite function 
function inviteTo(btn){
    btn.style.background = '#0066ff';
    btn.innerHTML = 'Invited'
    btn.style.color = 'white';
    var id = document.getElementById('profile').alt;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/invite', true);
    xhr.setRequestHeader('content-type', 'application/json');
    var param = JSON.stringify({ id : id });
    xhr.send(param);
    
}

// Implementing invite responce
// adding onclick on the notification card, user will be redirect to the profile of person who have invited the user
var card_invite = document.getElementsByClassName('card-notification');
for(var i = 0 ; i < card_invite.length; i++){
    card_invite[i].addEventListener('click', function(){
        window.location.replace(`http://localhost:9000/profile/${this.id}`);
    });
}


// Writing in the book
/* function Writeinmybook(){
    // to get the username of bookholder
    var id = document.getElementById('profile').alt;
    var name = document.getElementById('profile_name').innerHTML;

    //sending POST request

   /*  var xhr = new XMLHttpRequest();
    xhr.open("POST", '/write', true);
    xhr.setRequestHeader('content-type', 'application/json');

    xhr.onload = function(){
        document.html.innerHTML = this.response;
    }

    var param = JSON.stringify({ id : id, name: name });
    xhr.send(param); 
} */


// AJAX for search
function showSearchResult(){
    var xhr = new XMLHttpRequest();
    
    xhr.open("POST", '/search', true);
    xhr.setRequestHeader('content-type', 'application/json');
    var search_text = document.getElementById('search_ip').value;
    var output = document.getElementById('feed-container');

    xhr.onreadystatechange = function(){
        console.log('Ready state is ' + xhr.readyState);
    }
    xhr.onload = function(){
        output.innerHTML = this.response;
        var s_card = document.getElementsByClassName('card');

        //
        // adding on click event on the div , result of search
        for(var i = 0 ; i < s_card.length; i++){
            s_card[i].addEventListener('click', function(){
                var id = document.getElementById(`card-id-lable${this.id}`).innerHTML;
                window.location.replace(`http://localhost:9000/profile/${id}`);
            });
        }
    }
    var param = JSON.stringify({ search_text: search_text });
    xhr.send(param);
}

                
                