# spa-comments

# Preliminary work

For the project, you will need to have MySql installed locally and an AWS account

## Recommended Approach for Working with AWS Credentials

Once you have created an account, you will be taken to the console
Go to the tab Security Credentials

![image](https://user-images.githubusercontent.com/60929911/221426500-0f7631f9-430e-4e64-94c0-a3508b075d7b.png)

Click users -> add user 

Enter your username and click the Provide user access to the AWS Management Console - optional checkbox

In the "Are you providing console access to a person" box, select the "I want to create an IAM user" checkbox

Click Next

In the *Permission Options* select *Attach permissions directly*

Find AmazonS3FullAccess in the list and check it

On step 3 click create user

You can save your console password somewhere and then click Return to users list

Now on the users tab you can see the newly created user. Click on it and go to the Security Sredentials tab

In the Access Keys section, click Create Access Key, then select Application running outside AWS and click Next

For convenience on the next page you can set a tag, for example "The key is intended for a user who will be able to upload a file from the Node application"

Click Create Key

**BE SURE TO SAVE BOTH KEYS: ACCESS AND SECRET OR DOWNLOAD CSV FILE**

### You will put them in the .env file in the appropriate variables

Now it's time to create Storage
Go to Storage->S3 as shown below
![image](https://user-images.githubusercontent.com/60929911/221427364-1afcfba3-ef6c-482d-abd6-39813f55fdf9.png)

Click Create Bucket

Name it 

In Object Ownership choose ACLs enabled

In Block Public Access settings for this bucket uncheck Block all public access
Then click Create Bucket

### The name of the basket you put in the .env file

## Google Recaptcha
Go to https://www.google.com/recaptcha/about/ and create your access and secret keys for recaptcha



# Docker

1. Clone repo on local machine
2. Create an .env in the root folder and fill in the blank fields based on the .env.sample
3. Run ```docker-compose up``` in the root folder with admin privileges
4. If you are making changes and want to recontain them, call docker-compose build
5. Now you can move to localhost:8888 and test the app

# For Local Development
1. Clone repo on local machine
2. You should create a .env file in both the client and server folder
3. You should run ```npm install``` in both the client and server folder
4. Once all the environment variables are set, start the server first (go to the server folder and run ```npm run server``` from there)
5. Run the client (go to the client folder and run ```npm start``` from there)

Please only push and pull requests from the root folder and do not create remote branches in the server or client folders
