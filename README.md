# To make a directory where our database will live

sudo mkdir -p /data/db

# To restart mongodb

brew services restart mongodb-community

# To insert into mongodb

db.[colection name].insert(\*_your data_)

# To see your database collection

db.[collection name].find()

# in a more readable format

db.[collection name].find().pretty()
