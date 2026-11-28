const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

loginForm.addEventListener('submit', async(event)=>{
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try{
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            },
            body: JSON.stringify({
                email, password
            })
        });
        const data = await response.json();
        
        loginMessage.textContent = data.message;

        if(response.ok){
            loginMessage.style.color = 'green';
            loginForm.reset();
        }else{
            loginMessage.style.color = 'red';
        }
    }catch(error){
        console.error("Login request error:", error);

        loginMessage.textContent = "Unable to connet to the server, Please try again";

        loginMessage.style.color = 'red';
    }
});