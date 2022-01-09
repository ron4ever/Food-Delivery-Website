-- Project Set Up --
Hi,
1. To set up the app locally open cmd and do npm install, (this will hopefully install pug, express (+sessions), and mongo correctly).
 1.1 If it spits out an error please retry and do npm install again this sometimes happen to me but the 2nd time it always works.		
 1.2 If you get a ReferenceError: TextEncoder is not defined error,
	please go into node_modules/whatwg-url/lib/encoding.js (lib can sometimes be also dist)
	and add: const { TextEncoder, TextDecoder } = require("util"); at the top of your document and try again.

2. To set up the mongodb make sure to make a directory with the mkdir database (or any other name you wish to call it) in the cmd
 2.1 Then do mongod --dbpath=database (or your choosen name) and it should start up.

3. Now you need to set up the users collection, run node database-initializer.js in cmd
 3.1 If at this step you get the ReferenceError: TextEncoder is not defined error please refer back to step 1.2

4. Now everything should hopefully work, do node server.js in cmd and the server should start.

-- Project Description -- 
Simulate a restaurant ordering system like UberEats that has users that can log in to the website
and order from various different restaurant menu's. The users are also able to view others and check out their orders if they are not
set to private.




 