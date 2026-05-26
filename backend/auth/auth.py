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



# LOGOUT
def logout_user():

    supabase.auth.sign_out()

    return {
        "success": True
    }