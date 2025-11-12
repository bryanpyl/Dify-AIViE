import json
import logging
import os
import random
import secrets

import httpx
from urllib.parse import urlencode
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
v_fim_client_id = os.getenv('FIM_CLIENT_ID')
v_fim_authorize_url = os.getenv('FIM_AUTHORIZE_URL')
v_fim_token_url = os.getenv('FIM_TOKEN_URL')
v_fim_user_info = os.getenv('FIM_USER_INFO')
v_fim_redirect_uri = os.getenv('FIM_REDIRECT_URI')
v_fim_client_secret = os.getenv('FIM_SECRET')
aivie_api_url = os.getenv("AIVIE_API_URL")
aivie_signin_url = os.getenv("AIVIE_SIGNIN_URL")

app = FastAPI()

# # Add session middleware with a secret key
app.add_middleware(SessionMiddleware, secret_key=v_fim_client_secret)

@app.get("/", response_class=HTMLResponse)
async def login_page(request: Request):
    # Generate a random state for CSRF checking
    v_oauth_state = str(random.randint(10000, 99999))
    # Set the session state for CSRF checking
    request.session['state'] = v_oauth_state

    # Build FIM authorization URL
    params = {
        "client_id": v_fim_client_id,
        "redirect_uri": v_fim_redirect_uri,
        "scope": "openid",
        "response_type": "code",
        "state": v_oauth_state,
    }

    authorize_url=f"{v_fim_authorize_url}?{urlencode(params)}"

    html_template = f"""
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{app_name}</title>
            <script>
                window.location.href = "{authorize_url}";
            </script>
        </head>
        <body>
            <h3>Checking User Status...</h3>
        </body>
        </html>
    """

    return HTMLResponse(content=html_template)

# Helper function for HTTP POST requests with SSL verification turned off
async def post_data(url: str, data: dict = None, headers: dict = None):
    async with httpx.AsyncClient(verify=False) as client:  # SSL verification disabled here
        response = await client.post(url, data=data, headers=headers)
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

@app.get("/callback")
async def callback_get(request: Request, code: str = Query(None), state: str = Query(None)):
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")

    # Prepare and make request to callback API
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': v_fim_client_id,
        'client_secret': v_fim_client_secret,
        'redirect_uri': v_fim_redirect_uri,
    }

    callback_response = await post_data(v_fim_token_url, data)

    if 'access_token' not in callback_response:
        raise HTTPException(status_code=500, detail="No token returned from API.")

    v_fim_access_token = callback_response['access_token']

    headers = {
        "Authorization": f"Bearer {v_fim_access_token}",
        "Content-Type": "application/json"
    }

    token_user_response = await post_data(v_fim_user_info, headers=headers)

    user_email = token_user_response['mail']

    # Prepare and make request to API
    user_payload = {
        "email": user_email,
        "language": "en-US",
        "remember_me": "true"
    }

    auth_response = await post_json(aivie_api_url, user_payload)

    if 'result' in auth_response and auth_response['result'] == 'success':
        access_token = auth_response['data']['access_token']
        refresh_token = auth_response['data']['refresh_token']

        html_template = f"""
            <!DOCTYPE html>
            <html>
                <body>
                    <script>
                        // Store the access_token and the refresh_token in localStorage
                        localStorage.setItem('console_token', '{access_token}');
                        localStorage.setItem('refresh_token', '{refresh_token}');

                        window.location.href = "/apps";
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
                        window.location.href = "{aivie_signin_url}";
                    </script>
                </body>
            </html>
        """

        return HTMLResponse(content=html_template)
        
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
