Dish Assistant Web App Version 1.0

#Usage Notes
---------------------------------------------------------
- This application solves the riddle of picking a dish in a foreign restaurant by recommending both familiar dishes and new ones worth trying based on the user's personal food profile previously stored by the user.
---------------------------------------------------------



To complete the READ.md part of the W02 Activity: Git Setup assignment, please add your favorite quote below:
- Rakell: "No other success can compensate for failure in the home." President David O. McKay


---------
To run the fastAPI on your local server:
uvicorn app.main:app --reload

Test it: 
http://localhost:8000/docs
http://localhost:8000/test


Important (Every time you come back to work locally on this, do step 4):

#1 Make sure you have python 3.14 installed (check: python --version)
#2 Get the Gemini API Key (in the group chat)
#3 Create virtual environment: python -m venv venv
#4 activate virtual environment: venv\Scripts\activate (You should see (venv) at the start of your terminal)
#5 Make sure all the dependencies are installed (upgrade pip adn install the requirements)
#6 Place the env file in the root (file in hte group chat)
#7 Run the app: uvicorn app.main:app --reload

*The env instructions are for Windows
