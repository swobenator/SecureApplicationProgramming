const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const displayName = document.getElementById('displayName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try{
        const response = await fetch(`/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                displayName,
                email,
                password
            })
        });

        const data = await response.json();

        registerMessage.textContent = data.message;

        if(response.ok){
            registerMessage.style.color = 'green';
            registerForm.reset();
        } else{
            registerMessage.style.color = 'red';
        }
    }catch(error){
        registerMessage.textContent = 'Unable to connect to the server. Please try again'

        registerMessage.style.color = 'red';
    }
});