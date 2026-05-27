from database.db import supabase


# SIGNUP
def signup_user(email, password):

    response = supabase.auth.sign_up({
        "email": email,
        "password": password
    })

    return response


# LOGIN
def login_user(email, password):

    response = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })

    return response


# GOOGLE LOGIN
def google_login():

    response = supabase.auth.sign_in_with_oauth({
        "provider": "google",
        "options": {
            "redirect_to": "https://ai-faq-chatbot-ebon.vercel.app"
        }
    })

    return response.url


# LOGOUT
def logout_user():

    supabase.auth.sign_out()

    return {
        "success": True
    }