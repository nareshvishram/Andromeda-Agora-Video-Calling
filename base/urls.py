from django.urls import path
from .views import *

urlpatterns = [
    path('', lobby),
    path('room/', room),
    path('get_token/',getToken),
    path('create_member/',createMember),
    path('get_remote_member/',getRemoteMember),
    path('delete_member/',deleteMember),
]
