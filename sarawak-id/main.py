import json
import logging
import os
import random
import secrets

import httpx
import uvicorn
from fastapi import FastAPI, Body, Form, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import HTMLResponse

# Create a logger
logger = logging.getLogger(__name__)

# Set logging configuration
logging.basicConfig(level=logging.DEBUG)  # Set the logging level

# Config. Change accordingly.
app_name = os.getenv('APP_NAME')
v_swkid_client_id = os.getenv('SWKID_CLIENT_ID')
v_swkid_login_url = os.getenv('SWKID_LOGIN_URL')
v_swkid_logout_url = os.getenv('SWKID_LOGOUT_URL')
v_swkid_redirect_uri = os.getenv('SWKID_REDIRECT_URI')
v_swkid_logout_redirect_uri = os.getenv('SWKID_LOGOUT_REDIRECT_URI')
v_swkid_plugin = os.getenv('SWKID_PLUGIN')
v_secret = os.getenv('SECRET')

app = FastAPI()

# Add session middleware with a secret key
app.add_middleware(SessionMiddleware, secret_key=v_secret)

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    # Generate a random state for CSRF checking
    v_oauth_state = str(random.randint(10000, 99999))
    # Set the session state for CSRF checking
    request.session['state'] = v_oauth_state

    html_template = f"""
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{app_name}</title>
            <script src={v_swkid_plugin}></script>
            <script type="text/javascript" language="javascript">
                document.addEventListener("DOMContentLoaded", function() {{
                    swkid_sso_init({{
                        client_id: '{v_swkid_client_id}',
                        state: '{v_oauth_state}',
                        response_type: 'code',
                        ekyc_redirect_post_uri: '{v_swkid_redirect_uri}',
                        redirect_uri: '{v_swkid_redirect_uri}',
                        logout_redirect_uri: '{v_swkid_logout_redirect_uri}',
                        logout_uri: '{v_swkid_logout_url}',
                        overwrite_login_function: '',
                        style: 'button',
                        icon_width: '30',
                        position: 'top-left',
                        misc_param: 'test param 1234',
                    }});
                    swkid_login_form_submit();
                }});
            </script>
        </head>
        <body>
            <h3>Checking User Status...</h3>
        </body>
        </html>
    """

    return HTMLResponse(content=html_template)

# API Configuration
api_base_url = os.getenv('API_BASE_URL')
token_exchange_url = f'{api_base_url}token_exchange'
token_user_url = f'{api_base_url}token_user'
scspedia_api_url = os.getenv("SCSPEDIA_API_URL")
scspedia_signin_url = os.getenv("SCSPEDIA_SIGNIN_URL")

# Helper function for HTTP POST requests with SSL verification turned off
async def post_data(url: str, data: dict):
    async with httpx.AsyncClient(verify=False) as client:  # SSL verification disabled here
        response = await client.post(url, data=data)
        try:
            return response.json()
        except Exception as e:
            return response.text

# Helper function for HTTP POST requests with SSL verification turned off
async def post_json(url: str, data: dict):
    async with httpx.AsyncClient(verify=False) as client:  # SSL verification disabled here
        response = await client.post(url, json=data)
        try:
            return response.json()
        except Exception as e:
            return response.text

@app.post("/token_exchange")
async def token_exchange(request: Request, code: str = Form(...), state: str = Form(...)):
    # Check CSRF
    session_state = request.session.get('state')

    if state != session_state:
        raise HTTPException(status_code=400, detail="CSRF state mismatch.")

    # Prepare and make request to token exchange API
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': v_swkid_client_id,
        'secret': v_secret
    }

    token_exchange_response = await post_data(token_exchange_url, data)

    if 'access_token' not in token_exchange_response:
        raise HTTPException(status_code=500, detail="No token returned from API.")

    # Make request to token user API to get user info
    token_user_response = await post_data(token_user_url, token_exchange_response)

    user_email = token_user_response['data']['usr_email']

    # Prepare and make request to API
    user_payload = {
        "email": user_email,
        "language": "en-US",
        "remember_me": "true"
    }

    auth_response = await post_json(scspedia_api_url, user_payload)

    if 'result' in auth_response and auth_response['result'] == 'success':
        access_token = auth_response['data']['access_token']
        refresh_token = auth_response['data']['refresh_token']
        chat_token = auth_response['data']['chat_token']

        html_template = f"""
            <!DOCTYPE html>
            <html>
                <body>
                    <script>
                        // Store the access_token and the refresh_token in localStorage
                        localStorage.setItem('console_token', '{access_token}');
                        localStorage.setItem('refresh_token', '{refresh_token}');

                        // Check if chat_token is provided
                        if ('{chat_token}' && '{chat_token}' !== '') {{
                            // Redirect to the chat URL if chat_token is available
                            window.location.href = "/chat/{chat_token}";
                        }} else {{
                            // Redirect to the apps URL if chat_token is empty
                            window.location.href = "/apps";
                        }}
                    </script>
                </body>
            </html>
            """

        return HTMLResponse(content=html_template)
    else:
        message = auth_response['message']

        html_template = f"""
            <!DOCTYPE html>
            <html>
                <body>
                    <script>
                        // Store the error message in localStorage
                        localStorage.setItem('error_message', '{message}');
                        
                        // Redirect to the URL
                        window.location.href = "{scspedia_signin_url}";
                    </script>
                </body>
            </html>
        """

        return HTMLResponse(content=html_template)
        
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
