import json
from threading import currentThread
from traceback import print_tb
from django.http import JsonResponse
from django.shortcuts import render
from agora_token_builder import RtcTokenBuilder
from django.http import JsonResponse
import random
import time
from .models import *
from django.views.decorators.csrf import csrf_exempt
# Create your views here.

# Generate token dynamically
def getToken(request):
    #get appId,appCertificate from the AgoraPlatform
    appId='f912d15072494a62b85a1720b7755e43'
    appCertificate='0c3650f645e64bcbb71c76755c95a7a4';
    #get channel name from the browser url : get_token/?channel=test
    channelName=request.GET.get('channel')

    #generate random UID from 1 to 230
    uid=random.randint(1,230)

    # generate 24hr=60*60*24
    expirationTimeInSec=3600*24;

    #expire it from the current time to next 24hr
    currentTimeStamp=time.time()

    #privilegeExpiredTs=currentTime+24hr
    privilegeExpiredTs=expirationTimeInSec+currentTimeStamp

    #Currently there is all hosts. role=1 meaning it's host
    role=1

    #generate the token
    #visit : https://pypi.org/project/agora-token-builder/ for more about this package
    token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs)

    #JsonResponse() will give the result in json format. where it will contain token and uid
    return JsonResponse({'token':token,'uid':uid},safe=False);

def lobby(request):
    return render(request, 'base/lobby.html')


def room(request):
    return render(request, 'base/room.html')

# we will call this method from js like an API
# This will be called whenever handleSubmit will be called from lobby.html's script
@csrf_exempt
def createMember(request):
    data=json.loads(request.body)
    member,createdOrNot=RoomMember.objects.get_or_create(
        uid=data['UID'],
        room=data['room_name'],
        name=data['name']
    )
    return JsonResponse({'name':data['name']},safe=False)

@csrf_exempt
def getRemoteMember(request):
    uid=request.GET.get('UID')
    room=request.GET.get('ROOM_NAME')
    member=RoomMember.objects.get(
        uid=uid,
        room=room
    )
    return JsonResponse({'member':member.name},safe=False)



@csrf_exempt
def deleteMember(request):
    data=json.loads(request.body)
    member,createdOrNot=RoomMember.objects.get_or_create(
        uid=data['UID'],
        room=data['room_name'],
        name=data['name']
    )
    member.delete()
    return JsonResponse('member deleted successfully',safe=False)