from statistics import mode
from unicodedata import name
from django.db import models

# Create your models here.
class RoomMember(models.Model):
    name=models.CharField(max_length=200)
    uid=models.CharField(max_length=200)
    room=models.CharField(max_length=200)

    def __str__(self):
        if self.name:
            return self.name
        return 'No Name'


'''
Display user name 
===============================================================================================
>> What's the Problem?
When a remote user joins the call, we are unable to show his name by saving it to session. This is only for local user.
My Name will be visible to me only.
>> I will not be able to access other user's name from their session. But I have access to their UID and room name
 from client.on("user-published", handleUserJoinedRemotely);
>> So I will just store the user's name to db and will query it whenever it needed by uid and room name.
===============================================================================================
------------------------------------------------------ How to do this? --------------------------------------------
1. Create Database model with name RoomMember | Store user name, uid, and room
2. On Join, Create RoomMember in db. Meaning whenever a user joins the call by /room/ then save the entered records to the db
3. On handleUserJoinedRemotely event, query the db for room members by uid and room and get the user's name if it's there
otherwise just add this to db.
4. On Leave, delete the member
'''